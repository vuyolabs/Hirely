"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Check,
  Circle,
  Clock,
  GraduationCap,
  IndianRupee,
  Loader2,
  MapPin,
  Send,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BENEFITS,
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_DEPARTMENTS,
  JobFormSchema,
  POPULAR_CITIES,
  WORK_MODES,
  deriveLocation,
  employmentTypeLabel,
  formatExperience,
  formatSalary,
  workModeLabel,
  type JobFormValues,
} from "@/lib/jobs";
import { createJob, updateJob } from "@/actions/recruiter";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { JdWriter } from "@/components/recruiter/jd-writer";
import {
  ErrorBanner,
  Field,
  PillGroup,
  Select,
  TagInput,
  TextInput,
} from "@/components/onboarding/fields";

export type JobFormProps = {
  companyName: string | null;
  /** Present when editing. */
  job?: { id: string; status: "DRAFT" | "PUBLISHED" | "CLOSED"; values: JobFormValues };
};

const EMPTY: JobFormValues = {
  title: "",
  department: "",
  employment_type: "FULL_TIME",
  experience_level: "MID",
  openings: "1",
  work_mode: "ONSITE",
  locations: [],
  min_experience: "",
  max_experience: "",
  salary_min: "",
  salary_max: "",
  salary_disclosed: true,
  skills: [],
  nice_to_have_skills: [],
  description: "",
  education: "",
  benefits: [],
  resume_required: true,
  application_deadline: "",
};

const SECTIONS = [
  { id: "role", title: "Role details" },
  { id: "location", title: "Location & work mode" },
  { id: "compensation", title: "Experience & salary" },
  { id: "skills", title: "Skills" },
  { id: "description", title: "Description & perks" },
  { id: "application", title: "Application settings" },
] as const;

const SECTION_FIELDS: Record<(typeof SECTIONS)[number]["id"], (keyof JobFormValues)[]> = {
  role: ["title", "department", "employment_type", "experience_level", "openings"],
  location: ["work_mode", "locations"],
  compensation: ["min_experience", "max_experience", "salary_min", "salary_max"],
  skills: ["skills", "nice_to_have_skills"],
  description: ["description", "education", "benefits"],
  application: ["application_deadline"],
};

function validate(values: JobFormValues) {
  const result = JobFormSchema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

export function JobForm({ companyName, job }: JobFormProps) {
  const router = useRouter();
  const isEditing = !!job;
  const [values, setValues] = useState<JobFormValues>(job?.values ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [isPending, startTransition] = useTransition();

  const liveErrors = useMemo(() => validate(values), [values]);
  // After the first submit attempt, errors track the values live.
  const shown = submitted ? liveErrors : errors;
  const err = (k: keyof JobFormValues) => shown[k];

  function set<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (!submitted && errors[key]) {
      setErrors((e) => {
        const rest = { ...e };
        delete rest[key];
        return rest;
      });
    }
  }

  const submit = (status: "DRAFT" | "PUBLISHED") => {
    setSubmitted(true);
    setServerError(null);
    const found = validate(values);
    if (Object.keys(found).length) {
      setErrors(found);
      document
        .getElementById(`field-${Object.keys(found)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setPendingStatus(status);
    startTransition(async () => {
      const res = job
        ? await updateJob(job.id, { values, status })
        : await createJob({ values, status });
      if (res.error) {
        setServerError(res.error);
        if (res.fieldErrors) {
          setSubmitted(false);
          setErrors(res.fieldErrors);
        }
        setPendingStatus(null);
      } else {
        router.push("/recruiter/jobs");
        router.refresh();
      }
    });
  };

  const sectionDone = (id: (typeof SECTIONS)[number]["id"]) =>
    SECTION_FIELDS[id].every((f) => !liveErrors[f]);
  const doneCount = SECTIONS.filter((s) => sectionDone(s.id)).length;

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All jobs
        </Link>
        <h1 className="mt-3 font-brand text-3xl font-extrabold tracking-[-0.035em]">
          {isEditing ? "Edit job posting" : "Post a new job"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Specific, complete listings get better-matched applicants — Hirely ranks candidates against
          the skills, experience and location you set here.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------- Form ---------- */}
        <div className="space-y-6">
          {serverError && <ErrorBanner>{serverError}</ErrorBanner>}

          <Section index={1} id="role" title="Role details" description="The basics candidates scan first.">
            <Field label="Job title" htmlFor="title" error={err("title")} className="sm:col-span-2">
              <TextInput id="title" value={values.title} invalid={!!err("title")} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Frontend Engineer" maxLength={100} />
            </Field>
            <Field label="Department / function" htmlFor="department" error={err("department")}>
              <Select id="department" value={values.department} invalid={!!err("department")} onChange={(e) => set("department", e.target.value)} placeholder="Select department" options={[...JOB_DEPARTMENTS]} />
            </Field>
            <Field label="Number of openings" htmlFor="openings" error={err("openings")}>
              <TextInput id="openings" inputMode="numeric" value={values.openings} invalid={!!err("openings")} onChange={(e) => set("openings", e.target.value.replace(/\D/g, ""))} placeholder="1" />
            </Field>
            <Field label="Employment type" className="sm:col-span-2">
              <PillGroup options={EMPLOYMENT_TYPES} value={[values.employment_type]} onChange={([v]) => v && set("employment_type", v as JobFormValues["employment_type"])} />
            </Field>
            <Field label="Seniority" className="sm:col-span-2">
              <PillGroup options={EXPERIENCE_LEVELS} value={[values.experience_level]} onChange={([v]) => v && set("experience_level", v as JobFormValues["experience_level"])} />
            </Field>
          </Section>

          <Section index={2} id="location" title="Location & work mode">
            <Field label="Work mode" className="sm:col-span-2">
              <PillGroup options={WORK_MODES} value={[values.work_mode]} onChange={([v]) => v && set("work_mode", v as JobFormValues["work_mode"])} />
            </Field>
            <Field
              label={values.work_mode === "REMOTE" ? "Hiring from (cities)" : "Job location(s)"}
              optional={values.work_mode === "REMOTE"}
              error={err("locations")}
              hint={values.work_mode === "REMOTE" ? "Leave empty if you hire from anywhere in India." : "Press Enter after each city."}
              className="sm:col-span-2"
            >
              <TagInput id="locations" value={values.locations} invalid={!!err("locations")} onChange={(v) => set("locations", v)} placeholder="e.g. Bengaluru" suggestions={POPULAR_CITIES} />
            </Field>
          </Section>

          <Section index={3} id="compensation" title="Experience & salary" description="Ranges help candidates self-select — and power the filters they search with.">
            <Field label="Minimum experience" htmlFor="min_experience" error={err("min_experience")}>
              <Select id="min_experience" value={values.min_experience} invalid={!!err("min_experience")} onChange={(e) => set("min_experience", e.target.value)} placeholder="Select" options={yearOptions(0)} />
            </Field>
            <Field label="Maximum experience" htmlFor="max_experience" optional error={err("max_experience")}>
              <Select id="max_experience" value={values.max_experience} invalid={!!err("max_experience")} onChange={(e) => set("max_experience", e.target.value)} placeholder="No maximum" options={[{ value: "", label: "No maximum" }, ...yearOptions(0)]} />
            </Field>
            <Field label="Salary from" htmlFor="salary_min" error={err("salary_min")} optional={!values.salary_disclosed}>
              <LpaInput id="salary_min" value={values.salary_min} invalid={!!err("salary_min")} onChange={(v) => set("salary_min", v)} placeholder="8" />
            </Field>
            <Field label="Salary up to" htmlFor="salary_max" optional error={err("salary_max")}>
              <LpaInput id="salary_max" value={values.salary_max} invalid={!!err("salary_max")} onChange={(v) => set("salary_max", v)} placeholder="14" />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 text-sm sm:col-span-2">
              <Checkbox checked={!values.salary_disclosed} onCheckedChange={(v) => set("salary_disclosed", v !== true)} className="mt-0.5" />
              <span>
                Don&apos;t show salary to candidates
                <span className="block text-xs text-muted-foreground">
                  The range is still used for matching and salary filters, but appears as “Not disclosed”.
                </span>
              </span>
            </label>
          </Section>

          <Section index={4} id="skills" title="Skills" description="Must-haves drive the match score. Nice-to-haves give a smaller boost.">
            <Field label="Must-have skills" error={err("skills")} className="sm:col-span-2">
              <TagInput id="skills" value={values.skills} invalid={!!err("skills")} onChange={(v) => set("skills", v)} placeholder="e.g. React, TypeScript, REST APIs" />
            </Field>
            <Field label="Nice-to-have skills" optional className="sm:col-span-2">
              <TagInput value={values.nice_to_have_skills} onChange={(v) => set("nice_to_have_skills", v)} placeholder="e.g. GraphQL, AWS" />
            </Field>
          </Section>

          <Section index={5} id="description" title="Description & perks">
            <JdWriter values={values} onApply={(html) => set("description", html)} disabled={isPending} />
            <Field label="Job description" error={err("description")} hint="Cover responsibilities, what success looks like, the team, and the hiring process." className="sm:col-span-2">
              <div className={cn("rounded-lg", err("description") && "ring-3 ring-destructive/20")}>
                <RichTextEditor value={values.description} onChange={(v) => set("description", v)} placeholder="What will this person do? What does a great first 90 days look like?" disabled={isPending} />
              </div>
            </Field>
            <Field label="Minimum education" htmlFor="education" optional>
              <Select id="education" value={values.education} onChange={(e) => set("education", e.target.value)} placeholder="Any qualification" options={[...EDUCATION_LEVELS]} />
            </Field>
            <div className="hidden sm:block" />
            <Field label="Benefits & perks" optional className="sm:col-span-2">
              <PillGroup multiple options={BENEFITS.map((b) => ({ value: b, label: b }))} value={values.benefits} onChange={(v) => set("benefits", v)} />
            </Field>
          </Section>

          <Section index={6} id="application" title="Application settings">
            <Field label="Application deadline" htmlFor="application_deadline" optional error={err("application_deadline")} hint="Leave empty to keep the role open until you close it.">
              <TextInput id="application_deadline" type="date" value={values.application_deadline} invalid={!!err("application_deadline")} onChange={(e) => set("application_deadline", e.target.value)} />
            </Field>
            <div className="hidden sm:block" />
            <label className="flex cursor-pointer items-start gap-3 text-sm sm:col-span-2">
              <Checkbox checked={values.resume_required} onCheckedChange={(v) => set("resume_required", v === true)} className="mt-0.5" />
              <span>
                Require a resume to apply
                <span className="block text-xs text-muted-foreground">
                  Candidates without an uploaded resume won&apos;t be able to apply.
                </span>
              </span>
            </label>
          </Section>
        </div>

        {/* ---------- Sidebar: preview + checklist ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Candidate preview
          </p>
          <JobPreview values={values} companyName={companyName} />

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Posting checklist</p>
              <span className="text-xs text-muted-foreground">
                {doneCount}/{SECTIONS.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(doneCount / SECTIONS.length) * 100}%` }} />
            </div>
            <ul className="mt-3 space-y-1">
              {SECTIONS.map((s) => {
                const done = sectionDone(s.id);
                return (
                  <li key={s.id}>
                    <a href={`#section-${s.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted">
                      {done ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={done ? "text-muted-foreground" : ""}>{s.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {/* ---------- Sticky action bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl md:left-(--sidebar-width)">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {submitted && Object.keys(liveErrors).length > 0
              ? `${Object.keys(liveErrors).length} field${Object.keys(liveErrors).length > 1 ? "s" : ""} need attention`
              : job?.status === "PUBLISHED"
                ? "This job is live — changes apply immediately."
                : "Drafts are only visible to your team."}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/recruiter/jobs" className={buttonVariants({ variant: "ghost", className: "rounded-full" })}>
              Cancel
            </Link>
            {job?.status !== "PUBLISHED" && (
              <Button type="button" variant="outline" disabled={isPending} onClick={() => submit("DRAFT")} className="rounded-full px-5">
                {pendingStatus === "DRAFT" && <Loader2 className="h-4 w-4 animate-spin" />}
                Save draft
              </Button>
            )}
            <Button type="button" disabled={isPending} onClick={() => submit("PUBLISHED")} className="gap-2 rounded-full px-6 font-semibold">
              {pendingStatus === "PUBLISHED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {job?.status === "PUBLISHED" ? "Save changes" : "Publish job"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function yearOptions(from: number) {
  return Array.from({ length: 31 - from }, (_, i) => {
    const y = i + from;
    return { value: String(y), label: y === 0 ? "0 (fresher)" : y === 30 ? "30 years" : `${y} ${y === 1 ? "year" : "years"}` };
  });
}

function Section({
  index,
  id,
  title,
  description,
  children,
}: {
  index: number;
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${id}`} className="scroll-mt-24 rounded-2xl border border-border bg-card">
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="grid gap-5 p-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function LpaInput({
  id,
  value,
  onChange,
  invalid,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <div id={`field-${id}`} className="flex">
      <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">₹</span>
      <TextInput id={id} inputMode="decimal" value={value} invalid={invalid} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} className="rounded-none" placeholder={placeholder} />
      <span className="inline-flex h-10 items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">LPA</span>
    </div>
  );
}

function JobPreview({ values, companyName }: { values: JobFormValues; companyName: string | null }) {
  const salary = formatSalary({
    salary_min: values.salary_min ? Number(values.salary_min) : null,
    salary_max: values.salary_max ? Number(values.salary_max) : null,
    salary_disclosed: values.salary_disclosed,
  });
  const location = deriveLocation(values.work_mode, values.locations) || "Location";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {(companyName || "C")[0]}
        </span>
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", !values.title && "text-muted-foreground")}>
            {values.title || "Job title"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{companyName || "Your company"}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formatExperience({
            min_experience: values.min_experience ? Number(values.min_experience) : 0,
            max_experience: values.max_experience ? Number(values.max_experience) : null,
          })}
        </span>
        <span className="flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5" />
          {salary ?? "Not disclosed"}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{location}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {employmentTypeLabel(values.employment_type)} · {workModeLabel(values.work_mode)}
        </span>
        {Number(values.openings) > 1 && (
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {values.openings} openings
          </span>
        )}
        {values.education && (
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {values.education}
          </span>
        )}
        {values.application_deadline && (
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Apply by {new Date(values.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
      {values.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {values.skills.slice(0, 6).map((s) => (
            <span key={s} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              {s}
            </span>
          ))}
          {values.skills.length > 6 && (
            <span className="px-1 text-[11px] text-muted-foreground">+{values.skills.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}
