import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { redirect } from "next/navigation";
import {
  PipelineView,
  type ApplicantItem,
} from "@/components/recruiter/pipeline-view";

export default async function RecruiterApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const session = await verifyRecruiter();
  const { jobId } = await searchParams;

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!recruiter) {
    redirect("/onboarding");
  }

  const recruiterJobs = await prisma.job.findMany({
    where: { recruiterId: recruiter.id },
    select: { id: true, title: true },
    orderBy: { created_at: "desc" },
  });

  const applications = await prisma.application.findMany({
    where: {
      job: { recruiterId: recruiter.id },
    },
    orderBy: { created_at: "desc" },
    include: {
      job: {
        select: { id: true, title: true },
      },
      candidate: {
        include: {
          user: {
            select: { email: true },
          },
        },
      },
      resume: {
        select: { id: true, file_name: true },
      },
      statusHistory: {
        orderBy: { created_at: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Candidate Pipeline (ATS)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review candidate qualifications, extracted resume attributes, and manage hiring stages.
        </p>
      </div>

      <PipelineView
        initialApplicants={applications as ApplicantItem[]}
        jobs={recruiterJobs}
        initialJobFilter={jobId || "ALL"}
      />
    </div>
  );
}
