import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/session"
import { parseJobFilters, parseJobPage } from "@/lib/job-search"
import { searchJobs } from "@/lib/job-search.server"

export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store" }

/**
 * GET /api/candidate/jobs?q=react&modes=REMOTE&sort=newest&page=2&pageSize=10&facets=0
 *
 * Open jobs for the signed-in candidate, filtered, sorted and paginated on
 * the server. `facets=0` skips the per-filter counts (e.g. when only the page
 * changed).
 */
export async function GET(request: NextRequest) {
    const session = await decrypt(request.cookies.get("session")?.value)
    if (!session?.userId || session.role !== "CANDIDATE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE })
    }

    const candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true, skills: true, experience: true, preferences: true, location: true, headline: true },
    })
    if (!candidate) {
        return NextResponse.json({ error: "Complete your profile first." }, { status: 404, headers: NO_STORE })
    }

    const params = request.nextUrl.searchParams

    try {
        const result = await searchJobs(
            { candidateId: candidate.id, profile: candidate },
            parseJobFilters(params),
            parseJobPage(params),
            { withFacets: params.get("facets") !== "0" },
        )
        return NextResponse.json(result, { headers: NO_STORE })
    } catch (error) {
        console.error("Job search failed:", error)
        return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500, headers: NO_STORE })
    }
}
