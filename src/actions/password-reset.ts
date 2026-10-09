"use server";

import crypto from "node:crypto";
import { after } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { ForgotPasswordSchema, ResetPasswordSchema } from "@/lib/definitions";

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string) {
    return crypto
        .createHmac("sha256", process.env.SESSION_SECRET!)
        .update(`${email}:${code}`)
        .digest("hex");
}

/*
 * The reset link must never be built from an attacker-controlled Host
 * header, so production requires APP_URL. Without it the email carries
 * only the code.
 */
async function resetLinkBase() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
    if (process.env.NODE_ENV === "production") return null;
    const host = (await headers()).get("host");
    return host ? `http://${host}` : null;
}

export type ForgotPasswordResult = {
    ok?: boolean;
    email?: string;
    errors?: { email?: string[] };
};

/**
 * Always reports success for a well-formed email, whether or not an
 * account exists, so the form can't be used to discover accounts.
 */
export async function requestPasswordReset(
    input: { email: string }
): Promise<ForgotPasswordResult> {
    const validated = ForgotPasswordSchema.safeParse(input);
    if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
    }

    const { email } = validated.data;
    const linkBase = await resetLinkBase();

    // Do the lookup and the (slow) email after responding, so response
    // time doesn't reveal whether the account exists either.
    after(async () => {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true, is_active: true },
            });
            if (!user?.is_active) return;

            const recent = await prisma.passwordResetToken.findFirst({
                where: {
                    email,
                    createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
                },
                select: { id: true },
            });
            if (recent) return;

            const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

            await prisma.$transaction([
                prisma.passwordResetToken.deleteMany({ where: { email } }),
                prisma.passwordResetToken.create({
                    data: {
                        email,
                        code_hash: hashCode(email, code),
                        expiresAt: new Date(Date.now() + CODE_TTL_MS),
                    },
                }),
            ]);

            const link = linkBase
                ? `${linkBase}/reset-password?email=${encodeURIComponent(email)}&code=${code}`
                : null;

            await sendPasswordResetEmail(email, code, link, CODE_TTL_MS / 60_000);
        } catch (error) {
            console.error("Password reset request failed:", error);
        }
    });

    return { ok: true, email };
}

export type ResetPasswordResult = {
    ok?: boolean;
    error?: string;
    errors?: Partial<Record<"email" | "code" | "password" | "confirmPassword", string[]>>;
};

export async function resetPassword(input: {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
}): Promise<ResetPasswordResult> {
    const validated = ResetPasswordSchema.safeParse(input);
    if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
    }

    const { email, code, password } = validated.data;
    const expired = "This code is invalid or has expired. Request a new one.";

    const token = await prisma.passwordResetToken.findFirst({
        where: { email, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
    });

    if (!token || token.attempts >= MAX_ATTEMPTS) {
        return { errors: { code: [expired] } };
    }

    const expected = Buffer.from(token.code_hash, "hex");
    const actual = Buffer.from(hashCode(email, code), "hex");

    if (!crypto.timingSafeEqual(expected, actual)) {
        const attempts = token.attempts + 1;
        const left = MAX_ATTEMPTS - attempts;

        if (left <= 0) {
            await prisma.passwordResetToken.deleteMany({ where: { email } });
            return {
                errors: { code: ["Too many incorrect attempts. Request a new code."] },
            };
        }

        await prisma.passwordResetToken.update({
            where: { id: token.id },
            data: { attempts },
        });
        return {
            errors: {
                code: [`That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`],
            },
        };
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (!user) {
        return { errors: { code: [expired] } };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: { password_hash: passwordHash },
        }),
        prisma.passwordResetToken.deleteMany({ where: { email } }),
        prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "UPDATE",
                resource_type: "User",
                resource_id: user.id,
                metadata: { event: "password_reset" },
            },
        }),
    ]);

    return { ok: true };
}
