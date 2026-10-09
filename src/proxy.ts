import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const session = request.cookies.get("session")?.value
    const payload = await decrypt(session)

    const isAuthenticated = !!payload?.userId

    const isAuthRoute =
        pathname === "/login" ||
        pathname === "/signup"

    const isAdminRoute =
        pathname === "/admin" ||
        pathname.startsWith("/admin/")

    const isRecruiterRoute =
        pathname === "/recruiter" ||
        pathname.startsWith("/recruiter/")

    const isCandidateRoute =
        pathname === "/candidate" ||
        pathname.startsWith("/candidate/")

    const isOnboardingRoute =
        pathname === "/onboarding" ||
        pathname.startsWith("/onboarding/")

    /*
     * Authenticated users shouldn't visit login/signup.
     */
    if (isAuthenticated && isAuthRoute) {
        return redirectByRole(payload!.role, request)
    }

    /*
     * Protected routes require authentication.
     */
    if (
        !isAuthenticated &&
        (
            isAdminRoute ||
            isRecruiterRoute ||
            isCandidateRoute ||
            isOnboardingRoute
        )
    ) {
        return NextResponse.redirect(
            new URL("/login", request.url)
        )
    }

    /*
     * Nothing else to protect.
     */
    if (!payload) {
        return NextResponse.next()
    }

    /*
     * ADMIN
     */
    if (isAdminRoute) {
        if (payload.role !== "ADMIN") {
            return redirectByRole(payload.role, request)
        }

        return NextResponse.next()
    }

    /*
     * RECRUITER & CANDIDATE
     */
    if (isRecruiterRoute || isCandidateRoute || isOnboardingRoute) {
        const role = payload.role

        if (
            role === "ADMIN" ||
            (isRecruiterRoute && role !== "RECRUITER") ||
            (isCandidateRoute && role !== "CANDIDATE")
        ) {
            return redirectByRole(role, request)
        }

        /*
         * Candidates and recruiters must finish onboarding
         * before they reach their dashboard…
         */
        if (!payload.onboardingCompleted) {
            if (!isOnboardingRoute) {
                return NextResponse.redirect(
                    new URL("/onboarding", request.url)
                )
            }

            return NextResponse.next()
        }

        /*
         * …and can't return to it afterwards.
         */
        if (isOnboardingRoute) {
            return redirectByRole(role, request)
        }

        return NextResponse.next()
    }

    return NextResponse.next()
}

function redirectByRole(
    role: "CANDIDATE" | "RECRUITER" | "ADMIN",
    request: NextRequest
) {
    switch (role) {
        case "ADMIN":
            return NextResponse.redirect(
                new URL("/admin", request.url)
            )

        case "RECRUITER":
            return NextResponse.redirect(
                new URL("/recruiter", request.url)
            )

        case "CANDIDATE":
            return NextResponse.redirect(
                new URL("/candidate", request.url)
            )
    }
}

export const config = {
    matcher: [
        "/login",
        "/signup",

        "/candidate",
        "/candidate/:path*",

        "/recruiter",
        "/recruiter/:path*",

        "/admin",
        "/admin/:path*",

        "/onboarding",
        "/onboarding/:path*",
    ],
}