import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { JobsList } from "@/components/recruiter/jobs-list";

export default async function RecruiterJobsPage() {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!recruiter) return null;

  const jobs = await prisma.job.findMany({
    where: { recruiterId: recruiter.id },
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Job Postings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all published and draft positions, edit status, and track applicants.
        </p>
      </div>

      <JobsList initialJobs={jobs} />
    </div>
  );
}
