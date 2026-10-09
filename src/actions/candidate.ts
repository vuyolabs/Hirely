"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyCandidate } from "@/lib/dal";
import { z } from "zod";

export type ActionResponse = {
  success?: boolean;
  error?: string;
};

export async function applyToJob(
  jobId: string,
  resumeId: string | null,
  coverLetter: string | null
): Promise<ActionResponse> {
  const session = await verifyCandidate();

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    include: {
      resumes: {
        where: { status: "PARSED" },
        take: 1,
      },
    },
  });

  if (!candidate) {
    return { error: "Candidate profile not found." };
  }

  // Check if already applied
  const existing = await prisma.application.findUnique({
    where: {
      jobId_candidateId: {
        jobId,
        candidateId: candidate.id,
      },
    },
  });

  if (existing) {
    return { error: "You have already applied to this job." };
  }

  // Determine resume to use
  const selectedResumeId =
    resumeId || (candidate.resumes.length > 0 ? candidate.resumes[0].id : null);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true, resume_required: true },
  });

  if (!job || job.status !== "PUBLISHED") {
    return { error: "This job is no longer accepting applications." };
  }

  if (job.resume_required && !selectedResumeId) {
    return {
      error: "A resume is required to apply. Please complete onboarding or upload a resume first.",
    };
  }

  try {
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        resumeId: selectedResumeId,
        cover_letter: coverLetter?.trim() || null,
        status: "APPLIED",
        statusHistory: {
          create: {
            from_status: null,
            to_status: "APPLIED",
            changedById: session.userId,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CREATE",
        resource_type: "Application",
        resource_id: application.id,
        metadata: { jobId, candidateId: candidate.id },
      },
    });

    revalidatePath("/candidate");
    revalidatePath("/candidate/applications");
    revalidatePath("/candidate/jobs");
    return { success: true };
  } catch (error) {
    console.error("Failed to apply for job:", error);
    return { error: "Failed to submit application. Please try again." };
  }
}

export async function toggleSaveJob(jobId: string): Promise<ActionResponse> {
  const session = await verifyCandidate();

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!candidate) {
    return { error: "Candidate profile not found." };
  }

  const prefs = (candidate.preferences as Record<string, unknown>) || {};
  const savedJobs = Array.isArray(prefs.savedJobs)
    ? (prefs.savedJobs as string[])
    : [];

  const isSaved = savedJobs.includes(jobId);
  const updatedSavedJobs = isSaved
    ? savedJobs.filter((id) => id !== jobId)
    : [...savedJobs, jobId];

  await prisma.candidateProfile.update({
    where: { id: candidate.id },
    data: {
      preferences: {
        ...prefs,
        savedJobs: updatedSavedJobs,
      },
    },
  });

  revalidatePath("/candidate");
  revalidatePath("/candidate/jobs");
  revalidatePath("/candidate/saved");
  return { success: true };
}

const EducationItemSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

const ExperienceItemSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  title: z.string().min(1, "Job title is required"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const ProjectItemSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  technologies: z.array(z.string()).default([]),
});

const ProfileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  headline: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  education: z.array(EducationItemSchema).optional(),
  experience: z.array(ExperienceItemSchema).optional(),
  projects: z.array(ProjectItemSchema).optional(),
});

export async function updateCandidateProfile(
  data: z.infer<typeof ProfileUpdateSchema>
): Promise<ActionResponse> {
  const session = await verifyCandidate();

  const validated = ProfileUpdateSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input." };
  }

  try {
    await prisma.candidateProfile.update({
      where: { userId: session.userId },
      data: {
        first_name: validated.data.first_name,
        last_name: validated.data.last_name,
        headline: validated.data.headline || null,
        location: validated.data.location || null,
        phone: validated.data.phone || null,
        summary: validated.data.summary || null,
        ...(validated.data.skills !== undefined
          ? { skills: validated.data.skills }
          : {}),
        ...(validated.data.experience !== undefined
          ? { experience: validated.data.experience }
          : {}),
        ...(validated.data.education !== undefined
          ? { education: validated.data.education }
          : {}),
        ...(validated.data.projects !== undefined
          ? { projects: validated.data.projects }
          : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE",
        resource_type: "CandidateProfile",
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}
