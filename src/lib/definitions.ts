import * as z from "zod"

import { isValidMobile, normalizeMobile } from "@/lib/india"
import { PasswordSchema } from "@/lib/password"

const EmailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Please enter a valid email address." }))

const name = (label: string) =>
    z
        .string()
        .trim()
        .min(2, { error: `${label} must be at least 2 characters long.` })
        .max(50, { error: `${label} is too long.` })

export const SignupFormSchema = z
    .object({
        firstName: name("First name"),
        lastName: name("Last name"),

        email: EmailSchema,

        phone: z
            .string()
            .trim()
            .refine(isValidMobile, {
                error: "Enter a valid 10-digit Indian mobile number.",
            })
            .transform(normalizeMobile),

        password: PasswordSchema,

        role: z.enum(["CANDIDATE", "RECRUITER"]).default("CANDIDATE"),

        // Candidate
        workStatus: z.enum(["EXPERIENCED", "FRESHER"]).optional(),

        // Recruiter
        companyName: z.string().trim().optional(),
        jobTitle: z.string().trim().optional(),
        hiringFor: z.enum(["OWN_COMPANY", "CLIENTS"]).optional(),

        terms: z.literal("on", {
            error: "Please accept the terms to continue.",
        }),
    })
    .superRefine((data, ctx) => {
        if (data.role === "CANDIDATE" && !data.workStatus) {
            ctx.addIssue({
                code: "custom",
                path: ["workStatus"],
                message: "Tell us your current work status.",
            })
        }
        if (data.role === "RECRUITER") {
            if (!data.companyName || data.companyName.length < 2) {
                ctx.addIssue({
                    code: "custom",
                    path: ["companyName"],
                    message: "Company name is required.",
                })
            }
            if (!data.jobTitle || data.jobTitle.length < 2) {
                ctx.addIssue({
                    code: "custom",
                    path: ["jobTitle"],
                    message: "Your designation is required.",
                })
            }
        }
    })

export const LoginFormSchema = z.object({
    email: EmailSchema,

    password: z
        .string()
        .min(1, {
            error: "Password is required.",
        }),
})

export const ForgotPasswordSchema = z.object({
    email: EmailSchema,
})

export const ResetPasswordSchema = z
    .object({
        email: EmailSchema,
        code: z
            .string()
            .trim()
            .regex(/^\d{6}$/, { error: "Enter the 6-digit code from your email." }),
        password: PasswordSchema,
        confirmPassword: z.string().min(1, { error: "Please confirm your new password." }),
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        error: "Passwords don't match.",
    })

export type FormState =
    | {
        errors?: Partial<
            Record<
                | "firstName"
                | "lastName"
                | "email"
                | "phone"
                | "password"
                | "workStatus"
                | "companyName"
                | "jobTitle"
                | "hiringFor"
                | "terms",
                string[]
            >
        >
        /** Echoed back so the form keeps what the user typed after an error. */
        values?: Record<string, string>
        message?: string
    }
    | undefined

export type SessionPayload = {
    userId: string;
    role: "CANDIDATE" | "RECRUITER" | "ADMIN";
    onboardingCompleted: boolean;
    expiresAt: string;
};
