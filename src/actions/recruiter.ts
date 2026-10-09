"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { z } from "zod";
import { ApplicationStatus, EmploymentType, ExperienceLevel, JobStatus, WorkMode } from "@/generated/prisma/enums";
import { JobFormSchema, deriveLocation } from "@/lib/jobs";

export type ActionResponse = {
  success?: boolean;
  error?: string;
  jobId?: string;
  fieldErrors?: Record<string, string>;
};

const JobInputSchema = z.object({
  values: JobFormSchema,
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

function toJobData(values: z.output<typeof JobFormSchema>, status: "DRAFT" | "PUBLISHED") {
  const num = (v: string) => (v ? Number(v) : null);
  const locations = [...new Set(values.locations)];
  return {
    title: values.title,
    description: values.description,
    department: values.department,
    employment_type: values.employment_type as EmploymentType,
    experience_level: values.experience_level as ExperienceLevel,
    work_mode: values.work_mode as WorkMode,
    locations,
    location: deriveLocation(values.work_mode, locations),
    openings: Number(values.openings),
    min_experience: Number(values.min_experience),
    max_experience: num(values.max_experience),
    salary_min: num(values.salary_min),
    salary_max: num(values.salary_max),
    salary_disclosed: values.salary_disclosed,
    skills: [...new Set(values.skills)],
    nice_to_have_skills: [...new Set(values.nice_to_have_skills)],
    education: values.education || null,
    benefits: values.benefits,
    resume_required: values.resume_required,
    application_deadline: values.application_deadline
      ? new Date(values.application_deadline)
      : null,
    status: status as JobStatus,
  };
}

function validationError(error: z.ZodError): ActionResponse {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[issue.path[0] === "values" ? 1 : 0] ?? "");
    if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return { error: "Some fields need attention.", fieldErrors };
}

function revalidateJobPaths(jobId: string) {
  revalidatePath("/recruiter");
  revalidatePath("/recruiter/jobs");
  revalidatePath(`/recruiter/jobs/${jobId}/edit`);
  revalidatePath("/candidate");
  revalidatePath("/candidate/jobs");
  revalidatePath(`/candidate/jobs/${jobId}`);
}

export async function createJob(input: unknown): Promise<ActionResponse> {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found." };
  }

  const validated = JobInputSchema.safeParse(input);
  if (!validated.success) return validationError(validated.error);

  try {
    const job = await prisma.job.create({
      data: {
        recruiterId: recruiter.id,
        ...toJobData(validated.data.values, validated.data.status),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CREATE",
        resource_type: "Job",
        resource_id: job.id,
        metadata: { title: job.title, status: job.status },
      },
    });

    revalidateJobPaths(job.id);
    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("Failed to create job:", error);
    return { error: "Failed to create job. Please try again." };
  }
}

export async function updateJob(jobId: string, input: unknown): Promise<ActionResponse> {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found." };
  }

  const validated = JobInputSchema.safeParse(input);
  if (!validated.success) return validationError(validated.error);

  const existing = await prisma.job.findFirst({
    where: { id: jobId, recruiterId: recruiter.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return { error: "Job not found or access denied." };
  }

  // A closed job stays closed unless it's explicitly re-published.
  const status =
    existing.status === "CLOSED" && validated.data.status === "DRAFT"
      ? "CLOSED"
      : validated.data.status;

  try {
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...toJobData(validated.data.values, "DRAFT"),
        status: status as JobStatus,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE",
        resource_type: "Job",
        resource_id: updated.id,
        metadata: { title: updated.title, status: updated.status },
      },
    });

    revalidateJobPaths(updated.id);
    return { success: true, jobId: updated.id };
  } catch (error) {
    console.error("Failed to update job:", error);
    return { error: "Failed to update job. Please try again." };
  }
}

export async function toggleJobStatus(jobId: string, newStatus: JobStatus): Promise<ActionResponse> {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found." };
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, recruiterId: recruiter.id },
  });

  if (!job) {
    return { error: "Job not found or access denied." };
  }

  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: newStatus === "PUBLISHED" ? "PUBLISH" : newStatus === "CLOSED" ? "CLOSE" : "UPDATE",
        resource_type: "Job",
        resource_id: jobId,
        metadata: { fromStatus: job.status, toStatus: newStatus },
      },
    });

    revalidatePath("/recruiter");
    revalidatePath("/recruiter/jobs");
    revalidatePath("/candidate/jobs");
    return { success: true };
  } catch (error) {
    console.error("Failed to update job status:", error);
    return { error: "Failed to update job status." };
  }
}

export async function deleteJob(jobId: string): Promise<ActionResponse> {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found." };
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, recruiterId: recruiter.id },
  });

  if (!job) {
    return { error: "Job not found or access denied." };
  }

  try {
    // Delete status histories first, then applications, then job
    const applications = await prisma.application.findMany({
      where: { jobId },
      select: { id: true },
    });

    const appIds = applications.map((a) => a.id);
    if (appIds.length > 0) {
      await prisma.applicationStatusHistory.deleteMany({
        where: { applicationId: { in: appIds } },
      });
      await prisma.application.deleteMany({
        where: { jobId },
      });
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "DELETE",
        resource_type: "Job",
        resource_id: jobId,
      },
    });

    revalidatePath("/recruiter");
    revalidatePath("/recruiter/jobs");
    revalidatePath("/candidate/jobs");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete job:", error);
    return { error: "Failed to delete job." };
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<ActionResponse> {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found." };
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application || application.job.recruiterId !== recruiter.id) {
    return { error: "Application not found or unauthorized." };
  }

  try {
    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { status: newStatus },
      }),
      prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          from_status: application.status,
          to_status: newStatus,
          changedById: session.userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "STATUS_CHANGE",
          resource_type: "Application",
          resource_id: applicationId,
          metadata: { from: application.status, to: newStatus },
        },
      }),
    ]);

    revalidatePath("/recruiter");
    revalidatePath("/recruiter/applications");
    revalidatePath(`/recruiter/applications/${applicationId}`);
    revalidatePath("/candidate/applications");
    return { success: true };
  } catch (error) {
    console.error("Failed to update application status:", error);
    return { error: "Failed to update status." };
  }
}

export async function updateRecruiterProfile(data: {
  first_name: string;
  last_name: string;
  company_name?: string;
  job_title?: string;
}): Promise<ActionResponse> {
  const session = await verifyRecruiter();

  try {
    await prisma.recruiterProfile.update({
      where: { userId: session.userId },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name || null,
        job_title: data.job_title || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE",
        resource_type: "RecruiterProfile",
      },
    });

    revalidatePath("/recruiter/profile");
    revalidatePath("/recruiter");
    return { success: true };
  } catch (error) {
    console.error("Failed to update recruiter profile:", error);
    return { error: "Failed to update profile." };
  }
}
