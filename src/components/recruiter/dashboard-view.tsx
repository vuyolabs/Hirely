import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FilePlus2,
  FolderOpen,
  UserCheck,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  InitialsAvatar,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  humanize,
  timeAgo,
} from "@/components/dashboard/primitives";
import type { RecruiterDashboardData } from "@/lib/types/candidate";

export function RecruiterDashboardView({
  data,
}: {
  data: RecruiterDashboardData;
}) {
  const { recruiter, metrics, recentJobs, recentApplications } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={recruiter.company_name || "Hiring"}
        title={`Hi ${recruiter.first_name}, here's your pipeline`}
        description="Open roles, new applicants and who's moving forward."
        actions={
          <Link
            href="/recruiter/jobs/new"
            className={buttonVariants({ className: "gap-1.5 px-3.5" })}
          >
            <FilePlus2 className="h-4 w-4" />
            Post a job
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active jobs"
          value={metrics.activeJobsCount}
          hint="Currently published"
          icon={BriefcaseBusiness}
          href="/recruiter/jobs"
        />
        <StatCard
          label="All postings"
          value={metrics.totalJobsCount}
          hint="Including drafts & closed"
          icon={FolderOpen}
          tone="sky"
          href="/recruiter/jobs"
        />
        <StatCard
          label="Applicants"
          value={metrics.totalApplications}
          hint="Across all roles"
          icon={Users}
          tone="amber"
          href="/recruiter/applications"
        />
        <StatCard
          label="In pipeline"
          value={metrics.activeCandidatesCount}
          hint="Shortlisted or interviewing"
          icon={UserCheck}
          tone="emerald"
          href="/recruiter/applications"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Your job postings"
          description="Most recent first"
          action={{ href: "/recruiter/jobs", label: "Manage jobs" }}
          className="lg:col-span-2"
          bodyClassName="px-2 pb-2"
        >
          {recentJobs.length === 0 ? (
            <div className="px-3 pb-3">
              <EmptyState
                icon={BriefcaseBusiness}
                title="No job postings yet"
                description="Post your first role to start receiving pre-scored applicants."
                action={
                  <Link
                    href="/recruiter/jobs/new"
                    className={buttonVariants({ size: "sm" })}
                  >
                    Post a job
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y">
              {recentJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/recruiter/jobs/${job.id}/edit`}
                    className="group flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BriefcaseBusiness className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold group-hover:text-primary">
                          {job.title}
                        </p>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        <span>{humanize(job.employment_type)}</span>
                        <span>{humanize(job.experience_level)}</span>
                        {job.location && <span>{job.location}</span>}
                        <span>Posted {timeAgo(job.created_at)}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-brand text-xl font-extrabold tabular-nums">
                        {job._count.applications}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        applicant{job._count.applications === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="New applicants"
          description="Latest submissions"
          action={{ href: "/recruiter/applications", label: "Pipeline" }}
          bodyClassName="px-2 pb-2"
        >
          {recentApplications.length === 0 ? (
            <div className="px-3 pb-3">
              <EmptyState
                icon={Users}
                title="No applicants yet"
                description="Applications to your roles will appear here."
              />
            </div>
          ) : (
            <ul className="space-y-1">
              {recentApplications.map((app) => {
                const name = `${app.candidate.first_name} ${app.candidate.last_name}`;
                return (
                  <li key={app.id}>
                    <Link
                      href={`/recruiter/applications/${app.id}`}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                    >
                      <InitialsAvatar name={name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold group-hover:text-primary">
                          {name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {app.candidate.headline || `Applied for ${app.job.title}`}
                        </p>
                        {app.candidate.headline && (
                          <p className="truncate text-[11px] text-muted-foreground/80">
                            → {app.job.title}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={app.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="px-3 pt-2 pb-1">
            <Link
              href="/recruiter/applications"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full gap-1.5",
              })}
            >
              Review all applicants
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
