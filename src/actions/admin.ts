"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";
import { UserRole, JobStatus } from "@/generated/prisma/enums";

export type ActionResponse = {
  success?: boolean;
  error?: string;
};

export async function toggleUserStatus(userId: string): Promise<ActionResponse> {
  const session = await verifyAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, is_active: true, email: true },
  });

  if (!user) {
    return { error: "User not found." };
  }

  // Prevent admin from disabling themselves
  if (user.id === session.userId) {
    return { error: "You cannot disable your own administrator account." };
  }

  const newStatus = !user.is_active;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: newStatus ? "UPDATE" : "DISABLE",
        resource_type: "User",
        resource_id: userId,
        metadata: {
          targetEmail: user.email,
          newStatus: newStatus ? "active" : "disabled",
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle user status:", error);
    return { error: "Failed to update user status." };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<ActionResponse> {
  const session = await verifyAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!user) {
    return { error: "User not found." };
  }

  if (user.id === session.userId && newRole !== "ADMIN") {
    return { error: "You cannot remove your own administrator role." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE",
        resource_type: "User",
        resource_id: userId,
        metadata: {
          targetEmail: user.email,
          fromRole: user.role,
          toRole: newRole,
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { error: "Failed to update role." };
  }
}

export async function moderateJob(
  jobId: string,
  action: "CLOSE" | "DELETE"
): Promise<ActionResponse> {
  const session = await verifyAdmin();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, status: true },
  });

  if (!job) {
    return { error: "Job not found." };
  }

  try {
    if (action === "CLOSE") {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.CLOSED },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "CLOSE",
          resource_type: "Job",
          resource_id: jobId,
          metadata: { title: job.title, moderatedBy: "ADMIN" },
        },
      });
    } else if (action === "DELETE") {
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
          metadata: { title: job.title, moderatedBy: "ADMIN" },
        },
      });
    }

    revalidatePath("/admin/jobs");
    revalidatePath("/admin");
    revalidatePath("/candidate/jobs");
    return { success: true };
  } catch (error) {
    console.error("Failed to moderate job:", error);
    return { error: "Failed to moderate job." };
  }
}

export async function setCompanyVerification(
  companyId: string,
  status: "VERIFIED" | "REJECTED" | "PENDING",
  note?: string
): Promise<ActionResponse> {
  const session = await verifyAdmin();

  if (status === "REJECTED" && !note?.trim()) {
    return { error: "Add a reason so the employer knows what to fix." };
  }

  try {
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        verification_status: status,
        verification_note: note?.trim() || null,
        verified_at: status === "VERIFIED" ? new Date() : null,
      },
      select: { gstin: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "STATUS_CHANGE",
        resource_type: "Company",
        resource_id: companyId,
        metadata: { status, gstin: company.gstin, note: note?.trim() || null },
      },
    });

    revalidatePath("/admin/companies");
    revalidatePath("/recruiter");
    return { success: true };
  } catch (error) {
    console.error("Failed to update company verification:", error);
    return { error: "Failed to update verification status." };
  }
}
