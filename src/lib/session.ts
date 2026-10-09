import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type { SessionPayload } from "@/lib/definitions";

const secretKey = process.env.SESSION_SECRET;

if (!secretKey) {
    throw new Error("SESSION_SECRET is not defined");
}

const encodedKey = new TextEncoder().encode(secretKey);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey);
}

export async function decrypt(
    session: string | undefined = ""
): Promise<SessionPayload | null> {
    if (!session) {
        return null;
    }

    try {
        const { payload } = await jwtVerify<SessionPayload>(
            session,
            encodedKey,
            {
                algorithms: ["HS256"],
            }
        );

        return payload;
    } catch {
        return null;
    }
}

export async function createSession(
    userId: string,
    role: SessionPayload["role"],
    onboardingCompleted: boolean
) {
    const expiresAt = new Date(
        Date.now() + SESSION_DURATION
    );

    const session = await encrypt({
        userId,
        role,
        onboardingCompleted,
        expiresAt: expiresAt.toISOString(),
    });

    const cookieStore = await cookies();

    cookieStore.set("session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function updateSession(
    onboardingCompleted?: boolean
) {
    const cookieStore = await cookies();

    const session = cookieStore.get("session")?.value;

    if (!session) {
        return null;
    }

    const payload = await decrypt(session);

    if (!payload) {
        return null;
    }

    const expiresAt = new Date(
        Date.now() + SESSION_DURATION
    );

    const updatedPayload: SessionPayload = {
        ...payload,
        onboardingCompleted:
            onboardingCompleted ??
            payload.onboardingCompleted,
        expiresAt: expiresAt.toISOString(),
    };

    const newSession = await encrypt(updatedPayload);

    cookieStore.set("session", newSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });

    return updatedPayload;
}

export async function deleteSession() {
    const cookieStore = await cookies();

    cookieStore.delete("session");
}