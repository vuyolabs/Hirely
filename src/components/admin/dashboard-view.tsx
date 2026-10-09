import { formatDateTime } from "@/lib/format";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FileSpreadsheet,
  History,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  humanize,
  timeAgo,
} from "@/components/dashboard/primitives";
import type { AdminDashboardData } from "@/lib/types/candidate";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-500",
  PUBLISH: "bg-emerald-500",
  UPDATE: "bg-sky-500",
  STATUS_CHANGE: "bg-primary",
  LOGIN: "bg-muted-foreground/50",
  CLOSE: "bg-amber-500",
  DELETE: "bg-rose-500",
  DISABLE: "bg-rose-500",
};

export function AdminDashboardView({ data }: { data: AdminDashboardData }) {
  const { metrics, recentAudits } = data;

  const userMix = [
    { label: "Candidates", value: metrics.totalCandidates, className: "bg-primary" },
    { label: "Recruiters", value: metrics.totalRecruiters, className: "bg-sky-500" },
    { label: "Admins", value: metrics.totalAdmins, className: "bg-rose-500" },
  ];
  const publishedPct = metrics.totalJobs
    ? Math.round((metrics.publishedJobs / metrics.totalJobs) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Platform overview"
        description="Users, jobs, applications and everything that changed recently."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={metrics.totalUsers}
          hint={`${metrics.totalCandidates} candidates · ${metrics.totalRecruiters} recruiters`}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="Jobs"
          value={metrics.totalJobs}
          hint={`${metrics.publishedJobs} published`}
          icon={Briefcase}
          tone="sky"
          href="/admin/jobs"
        />
        <StatCard
          label="Applications"
          value={metrics.totalApplications}
          hint="All submissions"
          icon={FileSpreadsheet}
          tone="amber"
          href="/admin/applications"
        />
        <StatCard
          label="Audit events"
          value={metrics.totalAuditLogs}
          hint="Tracked actions"
          icon={History}
          tone="emerald"
          href="/admin/audit"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Panel title="User mix" description="Accounts by role">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {userMix.map((m) =>
                m.value > 0 ? (
                  <div
                    key={m.label}
                    className={m.className}
                    style={{ width: `${(m.value / Math.max(metrics.totalUsers, 1)) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-4 space-y-2.5">
              {userMix.map((m) => (
                <li key={m.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={cn("h-2.5 w-2.5 rounded-full", m.className)} />
                    {m.label}
                  </span>
                  <span className="font-semibold tabular-nums">{m.value}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Job health" description="Share of postings that are live">
            <div className="flex items-end justify-between">
              <p className="font-brand text-3xl font-extrabold tabular-nums">
                {publishedPct}%
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.publishedJobs} of {metrics.totalJobs} published
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${publishedPct}%` }}
              />
            </div>
          </Panel>

          <div className="grid gap-2">
            <QuickLink href="/admin/users" icon={Users} label="Manage users" />
            <QuickLink href="/admin/jobs" icon={Briefcase} label="Moderate jobs" />
            <QuickLink href="/admin/audit" icon={History} label="Full audit trail" />
          </div>
        </div>

        <Panel
          title="Recent activity"
          description="Latest audit log events"
          action={{ href: "/admin/audit", label: "View all" }}
          className="lg:col-span-2"
        >
          {recentAudits.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              description="Logins, edits and status changes will be logged here."
            />
          ) : (
            <ol className="relative space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-border">
              {recentAudits.map((log) => (
                <li key={log.id} className="relative flex items-start gap-4 rounded-xl py-2.5 pr-2">
                  <span className="relative z-10 mt-1 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border bg-card">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        ACTION_STYLES[log.action] ?? "bg-muted-foreground/50",
                      )}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{humanize(log.action)}</span>{" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-medium">{humanize(log.resource_type)}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {log.user.email} · {humanize(log.user.role)}
                    </p>
                  </div>
                  <time
                    dateTime={new Date(log.created_at).toISOString()}
                    title={formatDateTime(log.created_at)}
                    className="shrink-0 pt-0.5 text-xs text-muted-foreground"
                  >
                    {timeAgo(log.created_at)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
