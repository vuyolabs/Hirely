import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";
import { JobsModeration, type ModerationJob } from "@/components/admin/jobs-moderation";

export default async function AdminJobsPage() {
  await verifyAdmin();

  const jobs: ModerationJob[] = await prisma.job.findMany({
    orderBy: { created_at: "desc" },
    include: {
      recruiter: {
        include: {
          user: {
            select: { email: true },
          },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor all job openings posted across employers and enforce platform
          policies.
        </p>
      </div>

      <JobsModeration initialJobs={jobs} />
    </div>
  );
}
