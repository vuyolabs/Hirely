import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Search,
  Sparkles,
  UserPen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  InitialsAvatar,
  PageHeader,
  Panel,
  StageProgress,
  StatCard,
  StatusBadge,
  humanize,
  timeAgo,
} from "@/components/dashboard/primitives";
import type { CandidateDashboardData } from "@/lib/types/candidate";

export function CandidateDashboardView({
  data,
}: {
  data: CandidateDashboardData;
}) {
  const { candidate, metrics, recentJobs, recentApplications } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${candidate.first_name}`}
        description="Here's how your job search is going."
        actions={
          <Link
            href="/candidate/jobs"
            className={buttonVariants({ className: "gap-1.5 px-3.5" })}
          >
            <Search className="h-4 w-4" />
            Find jobs
          </Link>
        }
      />

      {/* Profile banner */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
        <div
          aria-hidden
          className="absolute -top-16 -right-10 -z-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              {candidate.onboarding_completed ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <UserPen className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="font-semibold">
                {candidate.onboarding_completed
                  ? "Your profile is live and matching"
                  : "Finish your profile to start matching"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {candidate.onboarding_completed
                  ? "We parsed your resume and rank new roles against your skills."
                  : "Upload a resume or add your skills so we can recommend roles."}
              </p>
              <p
                className={cn(
                  "mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium",
                  candidate.onboarding_completed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {candidate.onboarding_completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5" />
                )}
                {candidate.onboarding_completed
                  ? "Profile complete"
                  : "Onboarding pending"}
              </p>
            </div>
          </div>
          <Link
            href="/candidate/profile"
            className={buttonVariants({
              variant: "outline",
              className: "shrink-0 gap-1.5 bg-background/70",
            })}
          >
            {candidate.onboarding_completed ? "View profile" : "Complete profile"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open roles"
          value={metrics.totalPublishedJobs}
          hint="On the platform now"
          icon={BriefcaseBusiness}
          href="/candidate/jobs"
        />
        <StatCard
          label="Applications"
          value={metrics.totalApplications}
          hint="Sent in total"
          icon={FileText}
          tone="sky"
          href="/candidate/applications"
        />
        <StatCard
          label="In progress"
          value={metrics.inProgressApplications}
          hint="Still being reviewed"
          icon={Clock3}
          tone="amber"
          href="/candidate/applications"
        />
        <StatCard
          label="Saved"
          value={metrics.savedJobsCount}
          hint="Bookmarked roles"
          icon={Bookmark}
          tone="emerald"
          href="/candidate/saved"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommended jobs */}
        <Panel
          title="Recommended for you"
          description="Ranked by how well your skills match"
          action={{ href: "/candidate/jobs", label: "All jobs" }}
          className="lg:col-span-2"
          bodyClassName="px-2 pb-2"
        >
          {recentJobs.length === 0 ? (
            <div className="px-3 pb-3">
              <EmptyState
                icon={BriefcaseBusiness}
                title="No open roles yet"
                description="New jobs show up here as soon as they're published."
              />
            </div>
          ) : (
            <ul className="divide-y">
              {recentJobs.map((job) => {
                const company =
                  job.recruiter?.company_name || "Confidential employer";
                return (
                  <li key={job.id}>
                    <Link
                      href={`/candidate/jobs/${job.id}`}
                      className="group flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-muted/50"
                    >
                      <InitialsAvatar name={company} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold group-hover:text-primary">
                          {job.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{company}</span>
                          {job.location && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          <span>{humanize(job.employment_type)}</span>
                          <span>{humanize(job.experience_level)}</span>
                        </p>
                        {job.matchingSkills && job.matchingSkills.length > 0 && (
                          <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                            {job.matchingSkills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                              >
                                {s}
                              </span>
                            ))}
                            {job.matchingSkills.length > 4 && (
                              <span className="px-1 text-[10px] text-muted-foreground">
                                +{job.matchingSkills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {typeof job.matchScore === "number" && (
                        <MatchScore score={job.matchScore} />
                      )}
                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Applications */}
        <Panel
          title="Recent applications"
          description="Where each one stands"
          action={{ href: "/candidate/applications", label: "View all" }}
        >
          {recentApplications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="Apply to a recommended role and track it here."
              action={
                <Link
                  href="/candidate/jobs"
                  className={buttonVariants({ size: "sm" })}
                >
                  Browse jobs
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {recentApplications.map((app) => (
                <li
                  key={app.id}
                  className="rounded-xl border bg-background/50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {app.job.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {app.job.recruiter?.company_name || "Company"} ·{" "}
                        {timeAgo(app.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="mt-3">
                    <StageProgress status={app.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function MatchScore({ score }: { score: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const color =
    score >= 70
      ? "text-emerald-500"
      : score >= 40
        ? "text-amber-500"
        : "text-muted-foreground/50";

  return (
    <div
      className="relative h-11 w-11 shrink-0"
      title={`${score}% match`}
      aria-label={`${score}% match`}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5" className="stroke-muted" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className={color}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
        {score}%
      </span>
    </div>
  );
}
