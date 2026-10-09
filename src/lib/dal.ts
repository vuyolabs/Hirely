import "server-only"

import { cookies } from "next/headers"
import { cache } from "react"
import { redirect } from "next/navigation"

import { decrypt } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { calculateJobMatch } from "@/lib/recommendations"

export const verifySession = cache(async () => {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("session")?.value

    const session = await decrypt(cookie)

    if (!session?.userId) {
        redirect("/login")
    }

    return {
        isAuth: true,
        userId: session.userId,
        role: session.role,
    }
})

export const verifyAdmin = cache(async () => {
    const session = await verifySession()

    if (session.role !== "ADMIN") {
        redirect("/")
    }

    return session
})

export const verifyRecruiter = cache(async () => {
    const session = await verifySession()

    if (session.role !== "RECRUITER") {
        redirect("/")
    }

    return session
})

export const verifyCandidate = cache(async () => {
    const session = await verifySession()

    if (session.role !== "CANDIDATE") {
        redirect("/")
    }

    return session
})

export const getUser = cache(async () => {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("session")?.value

    const session = await decrypt(cookie)

    if (!session?.userId) {
        return null
    }

    try {
        return await prisma.user.findUnique({
            where: {
                id: session.userId,
            },
            select: {
                id: true,
                email: true,
                role: true,
                is_active: true,

                candidateProfile: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        phone: true,
                        location: true,
                        headline: true,
                        onboarding_completed: true,
                    },
                },

                recruiterProfile: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        company_name: true,
                        job_title: true,
                    },
                },
            },
        })
    } catch (error) {
        console.error("Failed to fetch user", error)
        return null
    }
})

export const getCandidateDashboardData = cache(async (userId: string) => {
    const candidate = await prisma.candidateProfile.findUnique({
        where: { userId },
    });

    if (!candidate) return null;

    const [
        totalPublishedJobs,
        totalApplications,
        inProgressApplications,
        availableJobs,
        recentApplications,
    ] = await Promise.all([
        prisma.job.count({ where: { status: "PUBLISHED" } }),
        prisma.application.count({ where: { candidateId: candidate.id } }),
        prisma.application.count({
            where: {
                candidateId: candidate.id,
                status: { in: ["SCREENING", "SHORTLISTED", "INTERVIEW"] },
            },
        }),
        prisma.job.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { created_at: "desc" },
            take: 30, // Score pool of latest published jobs
            include: {
                recruiter: {
                    select: { company_name: true },
                },
            },
        }),
        prisma.application.findMany({
            where: { candidateId: candidate.id },
            orderBy: { created_at: "desc" },
            take: 3,
            include: {
                job: {
                    select: {
                        title: true,
                        recruiter: {
                            select: { company_name: true },
                        },
                    },
                },
            },
        }),
    ]);

    // Rank jobs using candidate skills, experience level, and preferences
    const scoredJobs = availableJobs.map((job) => {
        const matchResult = calculateJobMatch(
            {
                skills: candidate.skills,
                experience: candidate.experience,
                preferences: candidate.preferences,
                location: candidate.location,
                headline: candidate.headline,
            },
            {
                id: job.id,
                title: job.title,
                skills: job.skills,
                nice_to_have_skills: job.nice_to_have_skills,
                experience_level: job.experience_level,
                employment_type: job.employment_type,
                work_mode: job.work_mode,
                location: job.location,
                locations: job.locations,
                min_experience: job.min_experience,
                max_experience: job.max_experience,
                created_at: job.created_at,
            }
        );

        return {
            ...job,
            // Prisma types Json columns loosely; keep only string skills.
            skills: Array.isArray(job.skills)
                ? job.skills.filter((s): s is string => typeof s === "string")
                : null,
            matchScore: matchResult.score,
            matchingSkills: matchResult.matchingSkills,
        };
    });

    // Sort by match score descending, then created_at descending
    scoredJobs.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const recentJobs = scoredJobs.slice(0, 3);

    const prefs = (candidate.preferences as Record<string, unknown>) || {};
    const savedJobs = Array.isArray(prefs.savedJobs) ? (prefs.savedJobs as string[]) : [];

    return {
        candidate: {
            id: candidate.id,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            onboarding_completed: candidate.onboarding_completed,
        },
        metrics: {
            totalPublishedJobs,
            totalApplications,
            inProgressApplications,
            savedJobsCount: savedJobs.length,
        },
        recentJobs,
        recentApplications,
    };
});

export const getCandidateFullProfile = cache(async (userId: string) => {
    return await prisma.candidateProfile.findUnique({
        where: { userId },
        include: {
            user: {
                select: { email: true },
            },
            resumes: {
                orderBy: { created_at: "desc" },
                take: 1,
            },
        },
    });
});

export const getCandidateApplicationsData = cache(async (userId: string) => {
    const candidate = await prisma.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!candidate) return null;

    const applications = await prisma.application.findMany({
        where: { candidateId: candidate.id },
        orderBy: { created_at: "desc" },
        include: {
            job: {
                include: {
                    recruiter: {
                        select: { company_name: true },
                    },
                },
            },
            statusHistory: {
                orderBy: { created_at: "desc" },
            },
            resume: {
                select: { file_name: true },
            },
        },
    });

    return applications;
});

export const getCandidateSavedJobsData = cache(async (userId: string) => {
    const candidate = await prisma.candidateProfile.findUnique({
        where: { userId },
        select: { id: true, preferences: true },
    });

    if (!candidate) return null;

    const prefs = (candidate.preferences as Record<string, unknown>) || {};
    const savedJobIds = Array.isArray(prefs.savedJobs) ? (prefs.savedJobs as string[]) : [];

    if (savedJobIds.length === 0) return [];

    return await prisma.job.findMany({
        where: {
            id: { in: savedJobIds },
            status: "PUBLISHED",
        },
        include: {
            recruiter: {
                select: { company_name: true },
            },
        },
    });
});

export const getRecruiterDashboardData = cache(async (userId: string) => {
    const recruiter = await prisma.recruiterProfile.findUnique({
        where: { userId },
    });

    if (!recruiter) return null;

    const [
        activeJobsCount,
        totalJobsCount,
        totalApplications,
        activeCandidatesCount,
        recentJobs,
        recentApplications,
    ] = await Promise.all([
        prisma.job.count({ where: { recruiterId: recruiter.id, status: "PUBLISHED" } }),
        prisma.job.count({ where: { recruiterId: recruiter.id } }),
        prisma.application.count({ where: { job: { recruiterId: recruiter.id } } }),
        prisma.application.count({
            where: {
                job: { recruiterId: recruiter.id },
                status: { in: ["SHORTLISTED", "INTERVIEW"] },
            },
        }),
        prisma.job.findMany({
            where: { recruiterId: recruiter.id },
            orderBy: { created_at: "desc" },
            take: 4,
            include: {
                _count: {
                    select: { applications: true },
                },
            },
        }),
        prisma.application.findMany({
            where: { job: { recruiterId: recruiter.id } },
            orderBy: { created_at: "desc" },
            take: 5,
            include: {
                candidate: {
                    select: {
                        first_name: true,
                        last_name: true,
                        headline: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        }),
    ]);

    return {
        recruiter: {
            id: recruiter.id,
            first_name: recruiter.first_name,
            last_name: recruiter.last_name,
            company_name: recruiter.company_name,
            job_title: recruiter.job_title,
        },
        metrics: {
            activeJobsCount,
            totalJobsCount,
            totalApplications,
            activeCandidatesCount,
        },
        recentJobs,
        recentApplications,
    };
});

export const getAdminDashboardData = cache(async () => {
    const [
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalAdmins,
        totalJobs,
        publishedJobs,
        totalApplications,
        totalAuditLogs,
        recentAudits,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CANDIDATE" } }),
        prisma.user.count({ where: { role: "RECRUITER" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.job.count(),
        prisma.job.count({ where: { status: "PUBLISHED" } }),
        prisma.application.count(),
        prisma.auditLog.count(),
        prisma.auditLog.findMany({
            orderBy: { created_at: "desc" },
            take: 6,
            include: {
                user: {
                    select: { email: true, role: true },
                },
            },
        }),
    ]);

    return {
        metrics: {
            totalUsers,
            totalCandidates,
            totalRecruiters,
            totalAdmins,
            totalJobs,
            publishedJobs,
            totalApplications,
            totalAuditLogs,
        },
        recentAudits,
    };
});

export const getAdminApplicationsData = cache(async (page: number = 1, pageSize: number = 10) => {
    const skip = (page - 1) * pageSize;
    const [
        totalApplications,
        appliedCount,
        screeningCount,
        shortlistedCount,
        interviewCount,
        hiredCount,
        rejectedCount,
        applications,
    ] = await Promise.all([
        prisma.application.count(),
        prisma.application.count({ where: { status: "APPLIED" } }),
        prisma.application.count({ where: { status: "SCREENING" } }),
        prisma.application.count({ where: { status: "SHORTLISTED" } }),
        prisma.application.count({ where: { status: "INTERVIEW" } }),
        prisma.application.count({ where: { status: "HIRED" } }),
        prisma.application.count({ where: { status: "REJECTED" } }),
        prisma.application.findMany({
            orderBy: { created_at: "desc" },
            skip,
            take: pageSize,
            include: {
                job: {
                    select: {
                        title: true,
                        recruiter: {
                            select: { company_name: true },
                        },
                    },
                },
                candidate: {
                    select: {
                        first_name: true,
                        last_name: true,
                        user: {
                            select: { email: true },
                        },
                    },
                },
            },
        }),
    ]);

    return {
        metrics: {
            totalApplications,
            appliedCount,
            screeningCount,
            shortlistedCount,
            interviewCount,
            hiredCount,
            rejectedCount,
        },
        applications,
        pagination: {
            currentPage: page,
            pageSize,
            totalCount: totalApplications,
            totalPages: Math.ceil(totalApplications / pageSize),
        },
    };
});