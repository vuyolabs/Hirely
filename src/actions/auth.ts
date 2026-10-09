"use server"

import {
    FormState,
    LoginFormSchema,
    SignupFormSchema,
} from "@/lib/definitions"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"
import { redirect } from "next/navigation"

const ECHOED_FIELDS = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "workStatus",
    "companyName",
    "jobTitle",
    "hiringFor",
] as const

export async function signup(
    state: FormState,
    formData: FormData
): Promise<FormState> {
    const values = Object.fromEntries(
        ECHOED_FIELDS.map((key) => [key, String(formData.get(key) ?? "")])
    )

    const validatedFields = SignupFormSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password"),
        role: formData.get("role") || "CANDIDATE",
        workStatus: formData.get("workStatus") || undefined,
        companyName: formData.get("companyName") || undefined,
        jobTitle: formData.get("jobTitle") || undefined,
        hiringFor: formData.get("hiringFor") || undefined,
        terms: formData.get("terms") ?? undefined,
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            values,
        }
    }

    const {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        workStatus,
        companyName,
        jobTitle,
        hiringFor,
    } = validatedFields.data

    const userExists = await prisma.user.findUnique({
        where: {
            email,
        },
    })

    if (userExists) {
        return {
            errors: {
                email: ["An account with this email already exists."],
            },
            values,
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    if (role === "RECRUITER") {
        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                role: "RECRUITER",
                recruiterProfile: {
                    create: {
                        first_name: firstName,
                        last_name: lastName,
                        phone,
                        company_name: companyName,
                        job_title: jobTitle,
                        hiring_for: hiringFor ?? "OWN_COMPANY",
                        onboarding_completed: false,
                    },
                },
                auditLogs: {
                    create: {
                        action: "CREATE",
                        resource_type: "User",
                        metadata: { role: "RECRUITER" },
                    },
                },
            },
        })

        await createSession(user.id, user.role, false)
        redirect("/onboarding")
    } else {
        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                role: "CANDIDATE",
                candidateProfile: {
                    create: {
                        first_name: firstName,
                        last_name: lastName,
                        phone,
                        preferences: { workStatus },
                        onboarding_completed: false,
                    },
                },
                auditLogs: {
                    create: {
                        action: "CREATE",
                        resource_type: "User",
                        metadata: { role: "CANDIDATE" },
                    },
                },
            },
        })

        await createSession(user.id, user.role, false)
        redirect("/onboarding")
    }
}

export async function login(
    state: FormState,
    formData: FormData
) {
    const validatedFields = LoginFormSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email, password } = validatedFields.data

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    })

    if (!user) {
        return {
            errors: {
                email: ["Invalid email or password"],
            },
        }
    }

    if (!user.is_active) {
        return {
            errors: {
                email: ["Your account has been disabled"],
            },
        }
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    )

    if (!isPasswordValid) {
        return {
            errors: {
                email: ["Invalid email or password"],
            },
        }
    }

    const onboardingCompleted =
        user.role === "CANDIDATE"
            ? (
                await prisma.candidateProfile.findUnique({
                    where: {
                        userId: user.id,
                    },
                    select: {
                        onboarding_completed: true,
                    },
                })
            )?.onboarding_completed ?? false
            : user.role === "RECRUITER"
                ? (
                    await prisma.recruiterProfile.findUnique({
                        where: {
                            userId: user.id,
                        },
                        select: {
                            onboarding_completed: true,
                        },
                    })
                )?.onboarding_completed ?? false
                : true;

    await createSession(
        user.id,
        user.role,
        onboardingCompleted
    );

    switch (user.role) {
        case "ADMIN":
            redirect("/admin")

        case "RECRUITER":
            redirect("/recruiter")

        case "CANDIDATE":
            redirect("/candidate")
    }
}

/*
 * Only clears the session. Callers navigate with a full page load (see
 * useSignOut): redirecting from here makes Next render /login with the
 * request's old cookie, which the proxy bounces back to the dashboard.
 */
export async function logout() {
    await deleteSession()
}