"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifyCandidate, verifyRecruiter } from "@/lib/dal";
import { updateSession } from "@/lib/session";
import { uploadResume, deleteResume } from "@/lib/storage";
import { extractPdfText } from "@/lib/pdf";
import { parseResume, type ParsedResume } from "@/lib/ai/resume-parser";
import { normalizeId, validateGstin } from "@/lib/india";
import {
    CandidateOnboardingSchema,
    RecruiterOnboardingSchema,
    fieldErrors,
} from "@/lib/onboarding";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export type OnboardingResult = {
    error?: string;
    fieldErrors?: Record<string, string>;
};

/* ------------------------------------------------------------------ */
/* Candidate                                                           */
/* ------------------------------------------------------------------ */

export type ParseResumeResult =
    | { ok: true; resumeId: string; fileName: string; parsed: ParsedResume }
    | { ok: false; error: string };

/**
 * Stores the PDF and runs AI extraction, but does NOT touch the profile:
 * the candidate reviews and corrects the extracted fields first.
 */
export async function parseResumeForOnboarding(
    formData: FormData
): Promise<ParseResumeResult> {
    const session = await verifyCandidate();

    const file = formData.get("resume");

    if (!(file instanceof File) || file.size === 0) {
        return { ok: false, error: "Please choose a resume to upload." };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { ok: false, error: "Resume must be smaller than 10MB." };
    }

    if (file.type !== "application/pdf") {
        return { ok: false, error: "Only PDF resumes are supported." };
    }

    const candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
    });

    if (!candidate) {
        return { ok: false, error: "Candidate profile not found." };
    }

    const resumeId = crypto.randomUUID();
    const objectKey = `${candidate.id}/${resumeId}.pdf`;
    let resumeCreated = false;

    try {
        const buffer = Buffer.from(await file.arrayBuffer());

        await uploadResume(objectKey, buffer, "application/pdf");

        await prisma.resume.create({
            data: {
                id: resumeId,
                candidateId: candidate.id,
                object_key: objectKey,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                status: "PROCESSING",
            },
        });
        resumeCreated = true;

        const resumeText = await extractPdfText(buffer);

        if (!resumeText.trim()) {
            throw new Error("Resume contains no readable text.");
        }

        const parsed = await parseResume(resumeText);

        await prisma.resume.update({
            where: { id: resumeId },
            data: { status: "PARSED", parsed_data: parsed },
        });

        return { ok: true, resumeId, fileName: file.name, parsed };
    } catch (error) {
        console.error("Resume parsing failed:", error);

        if (resumeCreated) {
            await prisma.resume
                .update({ where: { id: resumeId }, data: { status: "FAILED" } })
                .catch(() => { });
        }
        await deleteResume(objectKey).catch(() => { });

        return {
            ok: false,
            error:
                "We couldn't read that resume. Try another PDF, or fill in your details manually.",
        };
    }
}

export async function completeCandidateOnboarding(
    input: unknown
): Promise<OnboardingResult> {
    const session = await verifyCandidate();

    const validated = CandidateOnboardingSchema.safeParse(input);
    if (!validated.success) {
        return {
            error: "Some details need attention.",
            fieldErrors: fieldErrors(validated.error),
        };
    }

    const data = validated.data;

    const candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true, preferences: true },
    });

    if (!candidate) {
        return { error: "Candidate profile not found." };
    }

    if (data.resumeId) {
        const owned = await prisma.resume.findFirst({
            where: { id: data.resumeId, candidateId: candidate.id },
            select: { id: true },
        });
        if (!owned) {
            return { error: "That resume doesn't belong to your account." };
        }
    }

    const { basics, preferences } = data;
    const previousPrefs =
        (candidate.preferences as Record<string, unknown> | null) ?? {};

    try {
        await prisma.$transaction([
            prisma.candidateProfile.update({
                where: { id: candidate.id },
                data: {
                    first_name: basics.firstName,
                    last_name: basics.lastName,
                    phone: basics.phone,
                    location: basics.location,
                    headline: basics.headline,
                    summary: basics.summary || null,
                    skills: data.skills,
                    experience: data.experience,
                    education: data.education,
                    projects: data.projects,
                    preferences: {
                        ...previousPrefs,
                        workStatus: basics.workStatus,
                        totalExperience:
                            basics.workStatus === "EXPERIENCED"
                                ? {
                                    years: Number(basics.experienceYears || 0),
                                    months: Number(basics.experienceMonths || 0),
                                }
                                : null,
                        desiredRoles: preferences.desiredRoles,
                        preferredLocations: preferences.preferredLocations,
                        jobTypes: preferences.jobTypes,
                        workModes: preferences.workModes,
                        expectedSalaryLpa: preferences.expectedSalary
                            ? Number(preferences.expectedSalary)
                            : null,
                        noticePeriod: preferences.noticePeriod || null,
                        onboardingMethod: data.method,
                    },
                    onboarding_completed: true,
                },
            }),

            // Drop any earlier uploads from abandoned attempts.
            prisma.resume.updateMany({
                where: {
                    candidateId: candidate.id,
                    ...(data.resumeId ? { id: { not: data.resumeId } } : {}),
                    status: { in: ["PROCESSING", "PARSED", "FAILED"] },
                },
                data: { status: "ARCHIVED" },
            }),

            prisma.auditLog.create({
                data: {
                    userId: session.userId,
                    action: "UPDATE",
                    resource_type: "CandidateProfile",
                    resource_id: candidate.id,
                    metadata: { event: "onboarding_completed", method: data.method },
                },
            }),
        ]);
    } catch (error) {
        console.error("Candidate onboarding failed:", error);
        return { error: "We couldn't save your profile. Please try again." };
    }

    await updateSession(true);
    redirect("/candidate");
}

/* ------------------------------------------------------------------ */
/* Recruiter                                                           */
/* ------------------------------------------------------------------ */

export type CompanyLookup =
    | { exists: false }
    | {
        exists: true;
        displayName: string;
        legalName: string;
        status: "PENDING" | "VERIFIED" | "REJECTED";
    };

/** Lets a recruiter join a company a colleague already registered. */
export async function lookupCompanyByGstin(gstin: string): Promise<CompanyLookup> {
    await verifyRecruiter();

    const normalized = normalizeId(gstin);
    if (validateGstin(normalized)) return { exists: false };

    const company = await prisma.company.findUnique({
        where: { gstin: normalized },
        select: { display_name: true, legal_name: true, verification_status: true },
    });

    return company
        ? {
            exists: true,
            displayName: company.display_name,
            legalName: company.legal_name,
            status: company.verification_status,
        }
        : { exists: false };
}

export async function completeRecruiterOnboarding(
    input: unknown
): Promise<OnboardingResult> {
    const session = await verifyRecruiter();

    const validated = RecruiterOnboardingSchema.safeParse(input);
    if (!validated.success) {
        return {
            error: "Some details need attention.",
            fieldErrors: fieldErrors(validated.error),
        };
    }

    const { company, legal, recruiter } = validated.data;

    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
    });

    if (!profile) {
        return { error: "Recruiter profile not found." };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // An existing company is never overwritten by a new recruiter.
            const existing = await tx.company.findUnique({
                where: { gstin: legal.gstin },
                select: { id: true, display_name: true },
            });

            const companyRecord =
                existing ??
                (await tx.company.create({
                    data: {
                        legal_name: company.legalName,
                        display_name: company.displayName,
                        company_type: company.companyType,
                        industry: company.industry,
                        company_size: company.companySize,
                        founded_year: company.foundedYear ? Number(company.foundedYear) : null,
                        website: company.website || null,
                        description: company.description || null,
                        gstin: legal.gstin,
                        pan: legal.pan,
                        registration_number: legal.registrationNumber || null,
                        address_line: legal.addressLine,
                        city: legal.city,
                        state: legal.state,
                        pincode: legal.pincode,
                    },
                    select: { id: true, display_name: true },
                }));

            await tx.recruiterProfile.update({
                where: { id: profile.id },
                data: {
                    companyId: companyRecord.id,
                    company_name: companyRecord.display_name,
                    job_title: recruiter.jobTitle,
                    department: recruiter.department,
                    phone: recruiter.phone,
                    linkedin_url: recruiter.linkedinUrl || null,
                    hiring_for: recruiter.hiringFor,
                    hiring_volume: recruiter.hiringVolume,
                    onboarding_completed: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: session.userId,
                    action: existing ? "UPDATE" : "CREATE",
                    resource_type: "Company",
                    resource_id: companyRecord.id,
                    metadata: {
                        event: existing ? "recruiter_joined_company" : "company_registered",
                        gstin: legal.gstin,
                    },
                },
            });
        });
    } catch (error) {
        console.error("Recruiter onboarding failed:", error);
        return { error: "We couldn't save your company details. Please try again." };
    }

    await updateSession(true);
    redirect("/recruiter");
}
