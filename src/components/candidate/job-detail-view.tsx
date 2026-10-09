"use client";

import { formatDate } from "@/lib/format";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Gift,
  IndianRupee,
  Loader2,
  MapPin,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  employmentTypeLabel,
  experienceLevelLabel,
  formatExperience,
  formatSalary,
  workModeLabel,
} from "@/lib/jobs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { applyToJob, toggleSaveJob } from "@/actions/candidate";

export type JobDetail = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  locations: string[];
  department: string | null;
  employment_type: string;
  experience_level: string;
  work_mode: string;
  openings: number;
  min_experience: number;
  max_experience: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_disclosed: boolean;
  skills: string[];
  nice_to_have_skills: string[];
  education: string | null;
  benefits: string[];
  resume_required: boolean;
  application_deadline: Date | string | null;
  created_at: Date | string;
  companyVerified: boolean;
  recruiter: {
    company_name: string | null;
    first_name: string;
    last_name: string;
    job_title: string | null;
  };
};

type JobDetailViewProps = {
  job: JobDetail;
  match: { score: number; matchingSkills: string[] };
  hasApplied: boolean;
  isSaved: boolean;
  resumes: { id: string; file_name: string }[];
};

export function JobDetailView({
  job,
  match,
  hasApplied: initialHasApplied,
  isSaved: initialIsSaved,
  resumes,
}: JobDetailViewProps) {
  const [hasApplied, setHasApplied] = useState(initialHasApplied);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const selectedResumeId = resumes[0]?.id || "";

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const matched = new Set(match.matchingSkills);
  const salary = formatSalary(job);

  const handleApply = () => {
    setMessage(null);

    startTransition(async () => {
      const res = await applyToJob(
        job.id,
        selectedResumeId || null,
        coverLetter
      );

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setHasApplied(true);
        setMessage({ type: "success", text: "Application submitted successfully!" });
        setTimeout(() => {
          setIsApplyModalOpen(false);
          setCoverLetter("");
          setMessage(null);
        }, 1500);
      }
    });
  };

  const handleToggleSave = () => {
    startTransition(async () => {
      await toggleSaveJob(job.id);
      setIsSaved((prev) => !prev);
    });
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidate/jobs"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all jobs
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs"
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            {copied ? "Link Copied!" : "Share"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSave}
            disabled={isPending}
            className="text-xs"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="mr-1.5 h-3.5 w-3.5 text-primary fill-primary" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                Save Job
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {(job.recruiter.company_name || "C")[0]}
            </span>
            <div className="min-w-0">
              <h1 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">{job.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {job.recruiter.company_name || "Confidential employer"}
                  {job.companyVerified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified company" />}
                </span>
                {job.department && (
                  <>
                    <span aria-hidden>·</span>
                    {job.department}
                  </>
                )}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {formatExperience(job)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4" />
                  {salary ?? "Not disclosed"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {job.location || workModeLabel(job.work_mode)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Posted {formatDate(job.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:flex-row md:flex-col md:items-end">
            <span
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ring-1 ring-inset",
                match.score >= 75
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
                  : match.score >= 50
                    ? "bg-primary/10 text-primary ring-primary/20"
                    : "bg-muted text-muted-foreground ring-border",
              )}
            >
              <Sparkles className="h-4 w-4" />
              {match.score}% match
            </span>
            {hasApplied ? (
              <Button size="lg" disabled variant="secondary" className="rounded-full px-8 font-semibold">
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                Applied
              </Button>
            ) : (
              <Button size="lg" onClick={() => setIsApplyModalOpen(true)} className="rounded-full px-8 font-semibold">
                <Send className="mr-2 h-4 w-4" />
                Apply now
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Description */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">About the role</CardTitle>
            </CardHeader>
            <CardContent>
              {job.description.includes("<") && job.description.includes(">") ? (
                <div
                  className="prose prose-sm max-w-none leading-relaxed text-muted-foreground dark:prose-invert [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{job.description}</div>
              )}
            </CardContent>
          </Card>

          {job.benefits.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Benefits &amp; perks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {job.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {job.skills.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Skills</CardTitle>
                <CardDescription>
                  You have {match.matchingSkills.length} of {job.skills.length} must-have skills.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                        matched.has(skill) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {matched.has(skill) && <Check className="h-3 w-3" />}
                      {skill}
                    </span>
                  ))}
                </div>
                {job.nice_to_have_skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Nice to have</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.nice_to_have_skills.map((skill) => (
                        <span key={skill} className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Job details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border text-sm">
                <DetailRow label="Employment type" value={employmentTypeLabel(job.employment_type)} />
                <DetailRow label="Seniority" value={experienceLevelLabel(job.experience_level)} />
                <DetailRow label="Work mode" value={workModeLabel(job.work_mode)} />
                {job.locations.length > 0 && <DetailRow label="Locations" value={job.locations.join(", ")} />}
                <DetailRow label="Openings" value={String(job.openings)} />
                {job.education && <DetailRow label="Education" value={job.education} />}
                <DetailRow label="Resume" value={job.resume_required ? "Required" : "Optional"} />
                {job.application_deadline && (
                  <DetailRow
                    label="Apply by"
                    value={new Date(job.application_deadline).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                )}
                <DetailRow
                  label="Hiring contact"
                  value={`${job.recruiter.first_name} ${job.recruiter.last_name}${job.recruiter.job_title ? ` · ${job.recruiter.job_title}` : ""}`}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>
                Submit your application to {job.recruiter.company_name || "the hiring team"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Resume Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="resume-select">Attached Resume</Label>
                {resumes.length > 0 ? (
                  <div className="rounded-xl border p-3.5 flex items-center gap-3 bg-muted/40">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {resumes[0].file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parsed and linked to your candidate profile
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground text-center">
                    No parsed resume found. Please upload one in your profile.
                  </div>
                )}
              </div>

              {/* Cover Letter / Note */}
              <div className="space-y-1.5">
                <Label htmlFor="cover-letter">Note to Hiring Manager (Optional)</Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Share a brief introduction or highlight why you're a great fit for this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="min-h-24 text-xs"
                />
              </div>

              {message && (
                <div
                  className={`rounded-lg p-3 text-xs ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>

              <Button
                onClick={handleApply}
                disabled={isPending || hasApplied || (job.resume_required && resumes.length === 0)}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
