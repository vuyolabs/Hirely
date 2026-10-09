import * as z from "zod"

/** The hard requirements, shared by signup, reset and the UI checklist. */
export const PASSWORD_RULES = [
    { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { id: "letter", label: "A letter", test: (p: string) => /[a-zA-Z]/.test(p) },
    { id: "number", label: "A number", test: (p: string) => /[0-9]/.test(p) },
    { id: "symbol", label: "A symbol", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
] as const

export const PasswordSchema = z
    .string()
    .min(8, { error: "Password must be at least 8 characters long." })
    .max(128, { error: "Password is too long." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { error: "Password must contain at least one special character." })

const COMMON = [
    "password",
    "qwerty",
    "letmein",
    "welcome",
    "admin",
    "iloveyou",
    "monkey",
    "dragon",
    "abc123",
    "123456",
    "111111",
    "india",
    "hirely",
]

const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "01234567890"]

export type PasswordStrength = {
    /** 0 (empty/too weak) … 4 (strong) */
    score: 0 | 1 | 2 | 3 | 4
    label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong"
    /** Most useful single suggestion, if any. */
    tip: string | null
}

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const

/**
 * Heuristic strength estimate. Rewards length and variety; penalises
 * common words, keyboard/alphabet runs, repeats, and personal info.
 */
export function measurePassword(password: string, related: string[] = []): PasswordStrength {
    if (!password) return { score: 0, label: "Too weak", tip: null }

    const lower = password.toLowerCase()
    let points = 0
    let tip: string | null = null

    // Length carries most of the weight.
    points += Math.min(password.length, 20) * 4
    if (password.length >= 12) points += 10
    if (password.length >= 16) points += 10

    // Character variety.
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(password)).length
    points += (classes - 1) * 10
    if (classes < 3) tip = "Mix upper- and lowercase letters, numbers and symbols."

    // Penalties.
    if (/(.)\1{2,}/.test(password)) {
        points -= 15
        tip = "Avoid repeating the same character."
    }
    for (const seq of SEQUENCES) {
        for (let i = 0; i + 4 <= seq.length; i++) {
            const run = seq.slice(i, i + 4)
            if (lower.includes(run) || lower.includes([...run].reverse().join(""))) {
                points -= 15
                tip = "Avoid sequences like “abcd” or “1234”."
                break
            }
        }
    }
    if (COMMON.some((w) => lower.includes(w))) {
        points -= 30
        tip = "Avoid common words like “password” or “qwerty”."
    }
    const personal = related.flatMap((r) =>
        (r.toLowerCase().split("@")[0] ?? "").split(/[^a-z0-9]+/).filter((w) => w.length >= 3)
    )
    for (const part of personal) {
        if (lower.includes(part)) {
            points -= 30
            tip = "Don't include your name or email."
            break
        }
    }

    const meetsRules = PASSWORD_RULES.every((r) => r.test(password))
    let score: PasswordStrength["score"] =
        points >= 90 ? 4 : points >= 70 ? 3 : points >= 50 ? 2 : points >= 25 ? 1 : 0
    // Never call a password acceptable if it fails the hard rules.
    if (!meetsRules && score > 1) score = 1
    if (!tip && score < 4) tip = password.length < 12 ? "Longer is stronger — try 12+ characters." : null

    return { score, label: LABELS[score], tip }
}
