"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  PencilLine,
  RefreshCw,
  Sparkles,
  UploadCloud,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import * as z from "zod";

import { cn } from "@/lib/utils";
import {
  CandidateBasicsSchema,
  CandidatePreferencesSchema,
  EducationItemSchema,
  ExperienceItemSchema,
  JOB_TYPES,
  NOTICE_PERIODS,
  ProjectItemSchema,
  WORK_MODES,
  fieldErrors,
} from "@/lib/onboarding";
import {
  completeCandidateOnboarding,
  parseResumeForOnboarding,
} from "@/actions/onboarding";
import type { ParsedResume } from "@/lib/ai/resume-parser";
import {
  OnboardingShell,
  TitleAccent,
  type OnboardingStep,
} from "@/components/onboarding/onboarding-shell";
import {
  AddEntryButton,
  AiBadge,
  ChoiceCard,
  EntryCard,
  ErrorBanner,
  Field,
  FormSection,
  PillGroup,
  Select,
  TagInput,
  TextArea,
  TextInput,
} from "@/components/onboarding/fields";

/* ------------------------------------------------------------------ */
/* Draft model                                                         */
/* ------------------------------------------------------------------ */

type Entry<T> = T & { _id: string; _ai?: boolean };

type Experience = Entry<{
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}>;
type Education = Entry<{
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}>;
type Project = Entry<{ name: string; description: string; technologies: string[] }>;

type Basics = {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  workStatus: "" | "EXPERIENCED" | "FRESHER";
  experienceYears: string;
  experienceMonths: string;
};

type Draft = {
  step: number;
  furthest: number;
  method: "" | "RESUME" | "MANUAL";
  resumeId: string | null;
  resumeName: string | null;
  /** basics.* keys and "skills" that were filled by the parser and not yet edited. */
  aiFields: string[];
  basics: Basics;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  preferences: {
    desiredRoles: string[];
    preferredLocations: string[];
    jobTypes: string[];
    workModes: string[];
    expectedSalary: string;
    noticePeriod: string;
  };
};

const STEPS: OnboardingStep[] = [
  { key: "start", title: "Get started", description: "Resume upload or manual entry" },
  { key: "basics", title: "Basic details", description: "Who you are and how to reach you" },
  { key: "experience", title: "Work experience", description: "Roles you've held" },
  { key: "education", title: "Education", description: "Degrees and certifications" },
  { key: "skills", title: "Skills & projects", description: "What you're great at" },
  { key: "preferences", title: "Job preferences", description: "What you're looking for" },
  { key: "review", title: "Review & finish", description: "Confirm and go live" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyExperience = (): Experience => ({
  _id: uid(),
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  description: "",
});
const emptyEducation = (): Education => ({
  _id: uid(),
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
});
const emptyProject = (): Project => ({ _id: uid(), name: "", description: "", technologies: [] });

const SKILL_SUGGESTIONS = [
  "Communication",
  "Problem solving",
  "SQL",
  "Excel",
  "Python",
  "JavaScript",
  "React",
  "Java",
  "Data analysis",
  "Project management",
];
const CITY_SUGGESTIONS = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
];

/* ------------------------------------------------------------------ */

export function CandidateOnboarding({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    firstName: string;
    lastName: string;
    phone: string;
    workStatus: "" | "EXPERIENCED" | "FRESHER";
  };
}) {
  const storageKey = `hirely-onboarding:${userId}`;

  const [draft, setDraft] = useState<Draft>(() => ({
    step: 0,
    furthest: 0,
    method: "",
    resumeId: null,
    resumeName: null,
    aiFields: [],
    basics: {
      firstName: initial.firstName,
      lastName: initial.lastName,
      phone: initial.phone,
      location: "",
      headline: "",
      summary: "",
      workStatus: initial.workStatus,
      experienceYears: "",
      experienceMonths: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    preferences: {
      desiredRoles: [],
      preferredLocations: [],
      jobTypes: ["FULL_TIME"],
      workModes: [],
      expectedSalary: "",
      noticePeriod: "",
    },
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const restored = useRef(false);

  // Restore an in-progress draft, then keep it saved.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
      if (saved) setDraft((d) => ({ ...d, ...JSON.parse(saved) }));
    } catch {}
    restored.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {}
  }, [draft, storageKey]);

  const { step } = draft;
  const isFresher = draft.basics.workStatus === "FRESHER";

  const goTo = (next: number) => {
    setErrors({});
    setDraft((d) => ({ ...d, step: next, furthest: Math.max(d.furthest, next) }));
  };

  const clearError = (key: string) =>
    setErrors((e) => {
      if (!(key in e)) return e;
      const rest = { ...e };
      delete rest[key];
      return rest;
    });

  const setBasic = <K extends keyof Basics>(key: K, value: Basics[K]) => {
    clearError(`basics.${key}`);
    setDraft((d) => ({
      ...d,
      basics: { ...d.basics, [key]: value },
      aiFields: d.aiFields.filter((f) => f !== `basics.${key}`),
    }));
  };

  const setPref = <K extends keyof Draft["preferences"]>(
    key: K,
    value: Draft["preferences"][K],
  ) => {
    clearError(`preferences.${key}`);
    setDraft((d) => ({ ...d, preferences: { ...d.preferences, [key]: value } }));
  };

  function updateEntry<
    L extends "experience" | "education" | "projects",
    T extends Draft[L][number],
  >(list: L, index: number, patch: Partial<T>) {
    Object.keys(patch).forEach((k) => clearError(`${list}.${index}.${k}`));
    setDraft((d) => ({
      ...d,
      [list]: (d[list] as T[]).map((item, i) =>
        i === index ? { ...item, ...patch, _ai: false } : item,
      ),
    }));
  }

  const removeEntry = (list: "experience" | "education" | "projects", index: number) => {
    setErrors({});
    setDraft((d) => ({
      ...d,
      [list]: (d[list] as unknown[]).filter((_, i) => i !== index),
    }));
  };

  const addEntry = (list: "experience" | "education" | "projects") => {
    clearError(list);
    setDraft((d) => ({
      ...d,
      [list]: [
        ...d[list],
        list === "experience"
          ? emptyExperience()
          : list === "education"
            ? emptyEducation()
            : emptyProject(),
      ],
    }));
  };

  /* ---------- resume ---------- */

  const applyParsed = (resumeId: string, fileName: string, parsed: ParsedResume) => {
    setDraft((d) => {
      const ai: string[] = [];
      const pick = (key: keyof Basics, current: string, value: string | null) => {
        if (current.trim() || !value?.trim()) return current;
        ai.push(`basics.${key}`);
        return value.trim();
      };
      const phone = parsed.phone?.replace(/\D/g, "").slice(-10) ?? null;

      const basics: Basics = {
        ...d.basics,
        firstName: pick("firstName", d.basics.firstName, parsed.firstName),
        lastName: pick("lastName", d.basics.lastName, parsed.lastName),
        phone: pick("phone", d.basics.phone, phone),
        location: pick("location", d.basics.location, parsed.location),
        headline: pick("headline", d.basics.headline, parsed.headline),
        summary: pick("summary", d.basics.summary, parsed.summary),
        workStatus:
          d.basics.workStatus || (parsed.experience.length ? "EXPERIENCED" : "FRESHER"),
      };
      if (parsed.skills.length) ai.push("skills");

      return {
        ...d,
        resumeId,
        resumeName: fileName,
        aiFields: ai,
        basics,
        skills: parsed.skills.length ? parsed.skills : d.skills,
        experience: parsed.experience.map((e) => ({
          _id: uid(),
          _ai: true,
          company: e.company ?? "",
          title: e.title ?? "",
          startDate: e.startDate ?? "",
          endDate: e.endDate ?? "",
          description: e.description ?? "",
        })),
        education: parsed.education.map((e) => ({
          _id: uid(),
          _ai: true,
          institution: e.institution ?? "",
          degree: e.degree ?? "",
          field: e.field ?? "",
          startDate: e.startDate ?? "",
          endDate: e.endDate ?? "",
        })),
        projects: parsed.projects.map((p) => ({
          _id: uid(),
          _ai: true,
          name: p.name ?? "",
          description: p.description ?? "",
          technologies: p.technologies ?? [],
        })),
        preferences: {
          ...d.preferences,
          desiredRoles: d.preferences.desiredRoles.length
            ? d.preferences.desiredRoles
            : [parsed.experience[0]?.title].filter((t): t is string => !!t),
          preferredLocations: d.preferences.preferredLocations.length
            ? d.preferences.preferredLocations
            : [parsed.location?.split(",")[0]?.trim()].filter((t): t is string => !!t),
        },
      };
    });
  };

  /* ---------- per-step validation ---------- */

  const toPayload = () => ({
    method: draft.method === "" ? "MANUAL" : draft.method,
    resumeId: draft.resumeId,
    basics: draft.basics,
    experience: draft.experience.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      description: e.description || null,
    })),
    education: draft.education.map((e) => ({
      institution: e.institution,
      degree: e.degree || null,
      field: e.field || null,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
    })),
    skills: draft.skills,
    projects: draft.projects.map((p) => ({
      name: p.name,
      description: p.description || null,
      technologies: p.technologies,
    })),
    preferences: draft.preferences,
  });

  const check = (schema: z.ZodType, value: unknown, prefix: string) => {
    const r = schema.safeParse(value);
    if (r.success) return {};
    return Object.fromEntries(
      Object.entries(fieldErrors(r.error)).map(([k, v]) => [
        k ? `${prefix}.${k}` : prefix,
        v,
      ]),
    );
  };

  const validateStep = (index: number): Record<string, string> => {
    const p = toPayload();
    switch (STEPS[index].key) {
      case "start":
        if (!draft.method) return { method: "Choose how you'd like to build your profile." };
        if (draft.method === "RESUME" && !draft.resumeId)
          return { method: "Upload your resume, or switch to manual entry." };
        return {};
      case "basics":
        return check(CandidateBasicsSchema, p.basics, "basics");
      case "experience": {
        const errs = check(z.array(ExperienceItemSchema), p.experience, "experience");
        if (!isFresher && p.experience.length === 0)
          errs.experience = "Add at least one role from your work history.";
        return errs;
      }
      case "education":
        return check(
          z.array(EducationItemSchema).min(1, { error: "Add at least one education entry." }),
          p.education,
          "education",
        );
      case "skills":
        return {
          ...check(
            z.array(z.string()).min(3, { error: "Add at least 3 skills." }),
            p.skills,
            "skills",
          ),
          ...check(z.array(ProjectItemSchema), p.projects, "projects"),
        };
      case "preferences":
        return check(CandidatePreferencesSchema, p.preferences, "preferences");
      default:
        return {};
    }
  };

  const next = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }

    setSubmitError(null);
    startSubmit(async () => {
      const res = await completeCandidateOnboarding(toPayload());
      // Success redirects; we only get here on failure.
      if (res?.error) {
        setSubmitError(res.error);
        if (res.fieldErrors) {
          setErrors(res.fieldErrors);
          const first = Object.keys(res.fieldErrors)[0]?.split(".")[0];
          const target = STEPS.findIndex((s) => s.key === first);
          if (target >= 0) goTo(target);
        }
      } else {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }
    });
  };

  /* ---------- render ---------- */

  const err = (key: string) => errors[key];
  const ai = (key: string) => draft.aiFields.includes(key);
  const aiCount =
    draft.aiFields.length +
    [...draft.experience, ...draft.education, ...draft.projects].filter((e) => e._ai).length;

  const header = {
    start: {
      title: (
        <>
          Let&apos;s build your <TitleAccent>profile.</TitleAccent>
        </>
      ),
      description:
        "Recruiters on Hirely see a clean, structured profile — not your resume's layout. Choose how you'd like to start.",
    },
    basics: {
      title: (
        <>
          The <TitleAccent>basics.</TitleAccent>
        </>
      ),
      description: "How recruiters will see and contact you.",
    },
    experience: {
      title: isFresher ? (
        <>
          Any <TitleAccent>internships?</TitleAccent>
        </>
      ) : (
        <>
          Your work <TitleAccent>experience.</TitleAccent>
        </>
      ),
      description: isFresher
        ? "Internships, freelance or part-time work all count. You can skip this step."
        : "Start with your most recent role. Specific outcomes help you rank higher.",
    },
    education: {
      title: (
        <>
          Your <TitleAccent>education.</TitleAccent>
        </>
      ),
      description: "Add your highest qualification first.",
    },
    skills: {
      title: (
        <>
          Skills that get you <TitleAccent>matched.</TitleAccent>
        </>
      ),
      description:
        "Hirely ranks jobs by how well your skills cover what a role requires — be specific.",
    },
    preferences: {
      title: (
        <>
          What are you <TitleAccent>looking for?</TitleAccent>
        </>
      ),
      description: "We use this to rank roles and to tell you when a great match is posted.",
    },
    review: {
      title: (
        <>
          Review &amp; <TitleAccent>go live.</TitleAccent>
        </>
      ),
      description: "Check everything once. You can always edit your profile later.",
    },
  }[STEPS[step].key]!;

  return (
    <OnboardingShell
      steps={STEPS}
      current={step}
      furthest={draft.furthest}
      onStepClick={goTo}
      title={header.title}
      description={header.description}
      onBack={step > 0 ? () => goTo(step - 1) : undefined}
      onNext={next}
      nextLabel={
        step === STEPS.length - 1
          ? submitting
            ? "Saving…"
            : "Finish & find jobs"
          : step === 2 && isFresher && draft.experience.length === 0
            ? "Skip"
            : "Continue"
      }
      pending={submitting}
      railNote={
        draft.method === "RESUME" && draft.resumeName ? (
          <span className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Pre-filled from <strong className="text-foreground">{draft.resumeName}</strong>.
              Fields marked “From resume” need a quick check.
            </span>
          </span>
        ) : (
          "Your progress is saved on this device, so you can pick up where you left off."
        )
      }
    >
      {step === 0 && (
        <StartStep
          draft={draft}
          error={err("method")}
          onMethod={(method) => {
            clearError("method");
            setDraft((d) => ({ ...d, method }));
          }}
          onParsed={(id, name, parsed) => {
            clearError("method");
            applyParsed(id, name, parsed);
          }}
          onReset={() =>
            setDraft((d) => ({ ...d, resumeId: null, resumeName: null, aiFields: [] }))
          }
          onContinue={() => goTo(1)}
        />
      )}

      {step === 1 && (
        <div className="space-y-10">
          {aiCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm">
              <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                <span className="font-semibold">We pre-filled {aiCount} items from your resume.</span>{" "}
                <span className="text-muted-foreground">
                  AI can misread layouts — check anything marked <AiBadge className="mx-0.5 align-middle" />
                  before continuing.
                </span>
              </p>
            </div>
          )}

          <FormSection title="Personal details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" htmlFor="firstName" error={err("basics.firstName")} aiFilled={ai("basics.firstName")}>
                <TextInput id="firstName" value={draft.basics.firstName} invalid={!!err("basics.firstName")} onChange={(e) => setBasic("firstName", e.target.value)} autoComplete="given-name" />
              </Field>
              <Field label="Last name" htmlFor="lastName" error={err("basics.lastName")} aiFilled={ai("basics.lastName")}>
                <TextInput id="lastName" value={draft.basics.lastName} invalid={!!err("basics.lastName")} onChange={(e) => setBasic("lastName", e.target.value)} autoComplete="family-name" />
              </Field>
              <Field label="Mobile number" htmlFor="phone" error={err("basics.phone")} aiFilled={ai("basics.phone")} hint="Recruiters contact you here.">
                <div className="flex">
                  <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <TextInput id="phone" inputMode="numeric" value={draft.basics.phone} invalid={!!err("basics.phone")} onChange={(e) => setBasic("phone", e.target.value)} className="rounded-l-none" placeholder="98765 43210" autoComplete="tel-national" />
                </div>
              </Field>
              <Field label="Current city" htmlFor="location" error={err("basics.location")} aiFilled={ai("basics.location")}>
                <TextInput id="location" value={draft.basics.location} invalid={!!err("basics.location")} onChange={(e) => setBasic("location", e.target.value)} placeholder="e.g. Bengaluru" autoComplete="address-level2" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Work status">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
              <ChoiceCard
                selected={draft.basics.workStatus === "EXPERIENCED"}
                onSelect={() => setBasic("workStatus", "EXPERIENCED")}
                icon={Briefcase}
                title="I'm experienced"
                description="I have work experience (excluding internships)."
              />
              <ChoiceCard
                selected={draft.basics.workStatus === "FRESHER"}
                onSelect={() => setBasic("workStatus", "FRESHER")}
                icon={GraduationCap}
                title="I'm a fresher"
                description="I'm a student or haven't worked full-time yet."
              />
            </div>
            {err("basics.workStatus") && (
              <p className="text-xs font-medium text-destructive">{err("basics.workStatus")}</p>
            )}
            {draft.basics.workStatus === "EXPERIENCED" && (
              <Field label="Total experience" error={err("basics.experienceYears")}>
                <div className="grid max-w-sm grid-cols-2 gap-3">
                  <Select
                    aria-label="Years"
                    value={draft.basics.experienceYears}
                    invalid={!!err("basics.experienceYears")}
                    onChange={(e) => setBasic("experienceYears", e.target.value)}
                    placeholder="Years"
                    options={Array.from({ length: 31 }, (_, i) => ({
                      value: String(i),
                      label: i === 30 ? "30+ years" : `${i} ${i === 1 ? "year" : "years"}`,
                    }))}
                  />
                  <Select
                    aria-label="Months"
                    value={draft.basics.experienceMonths}
                    onChange={(e) => setBasic("experienceMonths", e.target.value)}
                    placeholder="Months"
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: String(i),
                      label: `${i} ${i === 1 ? "month" : "months"}`,
                    }))}
                  />
                </div>
              </Field>
            )}
          </FormSection>

          <FormSection title="Professional summary">
            <Field label="Headline" htmlFor="headline" error={err("basics.headline")} aiFilled={ai("basics.headline")} hint="One line recruiters see first, e.g. “Frontend engineer · React, TypeScript”.">
              <TextInput id="headline" value={draft.basics.headline} invalid={!!err("basics.headline")} onChange={(e) => setBasic("headline", e.target.value)} maxLength={120} />
            </Field>
            <Field label="Summary" htmlFor="summary" optional aiFilled={ai("basics.summary")} error={err("basics.summary")}>
              <TextArea id="summary" rows={4} value={draft.basics.summary} onChange={(e) => setBasic("summary", e.target.value)} placeholder="A few sentences about your experience and what you're great at." />
            </Field>
          </FormSection>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {err("experience") && <ErrorBanner>{err("experience")}</ErrorBanner>}
          {draft.experience.map((e, i) => (
            <EntryCard
              key={e._id}
              title={e.title || e.company || `Role ${i + 1}`}
              subtitle={e.title && e.company ? e.company : undefined}
              aiFilled={e._ai}
              onRemove={() => removeEntry("experience", i)}
            >
              <Field label="Job title" error={err(`experience.${i}.title`)}>
                <TextInput value={e.title} invalid={!!err(`experience.${i}.title`)} onChange={(ev) => updateEntry("experience", i, { title: ev.target.value })} placeholder="e.g. Software Engineer" />
              </Field>
              <Field label="Company" error={err(`experience.${i}.company`)}>
                <TextInput value={e.company} invalid={!!err(`experience.${i}.company`)} onChange={(ev) => updateEntry("experience", i, { company: ev.target.value })} placeholder="e.g. Infosys" />
              </Field>
              <Field label="Start date" optional>
                <TextInput value={e.startDate} onChange={(ev) => updateEntry("experience", i, { startDate: ev.target.value })} placeholder="Jan 2022" />
              </Field>
              <Field label="End date" optional hint="Leave as “Present” if you still work here.">
                <TextInput value={e.endDate} onChange={(ev) => updateEntry("experience", i, { endDate: ev.target.value })} placeholder="Present" />
              </Field>
              <Field label="What did you do?" optional className="sm:col-span-2">
                <TextArea rows={3} value={e.description} onChange={(ev) => updateEntry("experience", i, { description: ev.target.value })} placeholder="Key responsibilities and measurable outcomes." />
              </Field>
            </EntryCard>
          ))}
          <AddEntryButton onClick={() => addEntry("experience")}>
            {draft.experience.length ? "Add another role" : isFresher ? "Add an internship" : "Add a role"}
          </AddEntryButton>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {err("education") && <ErrorBanner>{err("education")}</ErrorBanner>}
          {draft.education.map((e, i) => (
            <EntryCard
              key={e._id}
              title={e.degree || e.institution || `Education ${i + 1}`}
              subtitle={e.degree && e.institution ? e.institution : undefined}
              aiFilled={e._ai}
              onRemove={() => removeEntry("education", i)}
            >
              <Field label="Institution" error={err(`education.${i}.institution`)} className="sm:col-span-2">
                <TextInput value={e.institution} invalid={!!err(`education.${i}.institution`)} onChange={(ev) => updateEntry("education", i, { institution: ev.target.value })} placeholder="e.g. IIT Madras" />
              </Field>
              <Field label="Degree" optional>
                <TextInput value={e.degree} onChange={(ev) => updateEntry("education", i, { degree: ev.target.value })} placeholder="e.g. B.Tech" />
              </Field>
              <Field label="Field of study" optional>
                <TextInput value={e.field} onChange={(ev) => updateEntry("education", i, { field: ev.target.value })} placeholder="e.g. Computer Science" />
              </Field>
              <Field label="Start year" optional>
                <TextInput value={e.startDate} onChange={(ev) => updateEntry("education", i, { startDate: ev.target.value })} placeholder="2018" />
              </Field>
              <Field label="End year (or expected)" optional>
                <TextInput value={e.endDate} onChange={(ev) => updateEntry("education", i, { endDate: ev.target.value })} placeholder="2022" />
              </Field>
            </EntryCard>
          ))}
          <AddEntryButton onClick={() => addEntry("education")}>
            {draft.education.length ? "Add another qualification" : "Add education"}
          </AddEntryButton>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-10">
          <FormSection title="Key skills" description="Add at least 3. Press Enter or comma after each one.">
            <Field label="Skills" error={err("skills")} aiFilled={ai("skills")}>
              <TagInput
                value={draft.skills}
                invalid={!!err("skills")}
                onChange={(skills) => {
                  clearError("skills");
                  setDraft((d) => ({
                    ...d,
                    skills,
                    aiFields: d.aiFields.filter((f) => f !== "skills"),
                  }));
                }}
                placeholder="e.g. React, SQL, Stakeholder management"
                suggestions={SKILL_SUGGESTIONS}
              />
            </Field>
          </FormSection>

          <FormSection title="Projects" description="Optional, but great for freshers and career-switchers.">
            <div className="space-y-4">
              {draft.projects.map((p, i) => (
                <EntryCard
                  key={p._id}
                  title={p.name || `Project ${i + 1}`}
                  aiFilled={p._ai}
                  onRemove={() => removeEntry("projects", i)}
                >
                  <Field label="Project name" error={err(`projects.${i}.name`)} className="sm:col-span-2">
                    <TextInput value={p.name} invalid={!!err(`projects.${i}.name`)} onChange={(ev) => updateEntry("projects", i, { name: ev.target.value })} />
                  </Field>
                  <Field label="Description" optional className="sm:col-span-2">
                    <TextArea rows={3} value={p.description} onChange={(ev) => updateEntry("projects", i, { description: ev.target.value })} />
                  </Field>
                  <Field label="Technologies" optional className="sm:col-span-2">
                    <TagInput value={p.technologies} onChange={(technologies) => updateEntry("projects", i, { technologies })} placeholder="e.g. Next.js, PostgreSQL" />
                  </Field>
                </EntryCard>
              ))}
              <AddEntryButton onClick={() => addEntry("projects")}>Add a project</AddEntryButton>
            </div>
          </FormSection>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-10">
          <FormSection title="Roles & locations">
            <Field label="Roles you're looking for" error={err("preferences.desiredRoles")}>
              <TagInput
                value={draft.preferences.desiredRoles}
                invalid={!!err("preferences.desiredRoles")}
                onChange={(v) => setPref("desiredRoles", v)}
                placeholder="e.g. Frontend Developer"
                suggestions={[...new Set(draft.experience.map((e) => e.title).filter(Boolean))]}
              />
            </Field>
            <Field label="Preferred locations" error={err("preferences.preferredLocations")}>
              <TagInput
                value={draft.preferences.preferredLocations}
                invalid={!!err("preferences.preferredLocations")}
                onChange={(v) => setPref("preferredLocations", v)}
                placeholder="e.g. Bengaluru"
                suggestions={[draft.basics.location, ...CITY_SUGGESTIONS].filter(Boolean)}
              />
            </Field>
          </FormSection>

          <FormSection title="Work style">
            <Field label="Job type" error={err("preferences.jobTypes")}>
              <PillGroup multiple options={JOB_TYPES} value={draft.preferences.jobTypes} invalid={!!err("preferences.jobTypes")} onChange={(v) => setPref("jobTypes", v)} />
            </Field>
            <Field label="Work mode" error={err("preferences.workModes")}>
              <PillGroup multiple options={WORK_MODES} value={draft.preferences.workModes} invalid={!!err("preferences.workModes")} onChange={(v) => setPref("workModes", v)} />
            </Field>
          </FormSection>

          <FormSection title="Compensation & availability">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Expected salary" optional error={err("preferences.expectedSalary")} hint="Only shared with recruiters you apply to.">
                <div className="flex">
                  <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">₹</span>
                  <TextInput inputMode="decimal" value={draft.preferences.expectedSalary} invalid={!!err("preferences.expectedSalary")} onChange={(e) => setPref("expectedSalary", e.target.value)} className="rounded-none" placeholder="12" />
                  <span className="inline-flex h-10 items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">LPA</span>
                </div>
              </Field>
              <Field label="Notice period" optional>
                <Select value={draft.preferences.noticePeriod} onChange={(e) => setPref("noticePeriod", e.target.value)} placeholder="Select" options={isFresher ? ["Immediate", ...NOTICE_PERIODS.slice(1)] : NOTICE_PERIODS} />
              </Field>
            </div>
          </FormSection>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          {submitError && <ErrorBanner>{submitError}</ErrorBanner>}
          {aiCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>
                <span className="font-semibold">{aiCount} items are still exactly as the AI read them.</span>{" "}
                <span className="text-muted-foreground">Open a section to double-check, or finish if they look right.</span>
              </p>
            </div>
          )}

          <ReviewCard title="Basic details" icon={UserRound} onEdit={() => goTo(1)}>
            <ReviewRow label="Name" value={`${draft.basics.firstName} ${draft.basics.lastName}`} />
            <ReviewRow label="Mobile" value={draft.basics.phone ? `+91 ${draft.basics.phone}` : "—"} />
            <ReviewRow label="City" value={draft.basics.location} />
            <ReviewRow
              label="Status"
              value={
                isFresher
                  ? "Fresher"
                  : `Experienced · ${draft.basics.experienceYears || 0}y ${draft.basics.experienceMonths || 0}m`
              }
            />
            <ReviewRow label="Headline" value={draft.basics.headline} />
          </ReviewCard>

          <ReviewCard title="Experience" icon={Briefcase} onEdit={() => goTo(2)}>
            {draft.experience.length ? (
              draft.experience.map((e) => (
                <ReviewRow key={e._id} label={[e.startDate, e.endDate].filter(Boolean).join(" – ") || "—"} value={`${e.title} · ${e.company}`} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No experience added.</p>
            )}
          </ReviewCard>

          <ReviewCard title="Education" icon={GraduationCap} onEdit={() => goTo(3)}>
            {draft.education.map((e) => (
              <ReviewRow key={e._id} label={e.endDate || "—"} value={[e.degree, e.field, e.institution].filter(Boolean).join(" · ")} />
            ))}
          </ReviewCard>

          <ReviewCard title="Skills & projects" icon={Sparkles} onEdit={() => goTo(4)}>
            <div className="flex flex-wrap gap-1.5">
              {draft.skills.map((s) => (
                <span key={s} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{s}</span>
              ))}
            </div>
            {draft.projects.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {draft.projects.length} project{draft.projects.length > 1 ? "s" : ""}: {draft.projects.map((p) => p.name).join(", ")}
              </p>
            )}
          </ReviewCard>

          <ReviewCard title="Preferences" icon={CheckCircle2} onEdit={() => goTo(5)}>
            <ReviewRow label="Roles" value={draft.preferences.desiredRoles.join(", ")} />
            <ReviewRow label="Locations" value={draft.preferences.preferredLocations.join(", ")} />
            <ReviewRow
              label="Type & mode"
              value={[
                ...draft.preferences.jobTypes.map((v) => JOB_TYPES.find((o) => o.value === v)?.label),
                ...draft.preferences.workModes.map((v) => WORK_MODES.find((o) => o.value === v)?.label),
              ].join(", ")}
            />
            <ReviewRow
              label="Expected"
              value={[
                draft.preferences.expectedSalary && `₹${draft.preferences.expectedSalary} LPA`,
                draft.preferences.noticePeriod && `Notice: ${draft.preferences.noticePeriod}`,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            />
          </ReviewCard>
        </div>
      )}
    </OnboardingShell>
  );
}

/* ------------------------------------------------------------------ */
/* Step 0: choose method, upload & parse                               */
/* ------------------------------------------------------------------ */

const PARSE_STAGES = [
  "Uploading your PDF",
  "Reading the document",
  "Extracting experience & education",
  "Detecting skills and projects",
];

function StartStep({
  draft,
  error,
  onMethod,
  onParsed,
  onReset,
  onContinue,
}: {
  draft: Draft;
  error?: string;
  onMethod: (m: "RESUME" | "MANUAL") => void;
  onParsed: (id: string, name: string, parsed: ParsedResume) => void;
  onReset: () => void;
  onContinue: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [stage, setStage] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!parsing) return;
    const id = setInterval(
      () => setStage((s) => Math.min(s + 1, PARSE_STAGES.length - 1)),
      1600,
    );
    return () => clearInterval(id);
  }, [parsing]);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setParseError(null);
    if (f.type !== "application/pdf") {
      setParseError("Please upload a PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setParseError("That file is over 10MB.");
      return;
    }
    setFile(f);
    setStage(0);
    setParsing(true);

    const fd = new FormData();
    fd.append("resume", f);
    const res = await parseResumeForOnboarding(fd);
    setParsing(false);

    if (!res.ok) {
      setParseError(res.error);
      setFile(null);
      return;
    }
    const p = res.parsed;
    setSummary(
      [
        p.experience.length && `${p.experience.length} role${p.experience.length > 1 ? "s" : ""}`,
        p.education.length && `${p.education.length} qualification${p.education.length > 1 ? "s" : ""}`,
        p.skills.length && `${p.skills.length} skills`,
        p.projects.length && `${p.projects.length} project${p.projects.length > 1 ? "s" : ""}`,
      ]
        .filter(Boolean)
        .join(" · "),
    );
    onParsed(res.resumeId, res.fileName, res.parsed);
  };

  const parsed = draft.method === "RESUME" && !!draft.resumeId;

  return (
    <div className="space-y-8">
      <div className="grid gap-3" role="radiogroup" aria-label="How would you like to start?">
        <ChoiceCard
          selected={draft.method === "RESUME"}
          onSelect={() => onMethod("RESUME")}
          icon={WandSparkles}
          title="Upload my resume"
          badge="Fastest · ~1 min"
          description="Our AI reads your PDF and pre-fills each step. You review and correct everything before it's saved."
        />
        <ChoiceCard
          selected={draft.method === "MANUAL"}
          onSelect={() => onMethod("MANUAL")}
          icon={PencilLine}
          title="Fill in manually"
          description="Don't have a resume handy? Enter your details step by step. You can upload a resume later."
        />
      </div>

      {error && !parseError && <ErrorBanner>{error}</ErrorBanner>}

      {draft.method === "RESUME" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {parsing && file ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">Analysing with AI — this takes a few seconds</p>
                </div>
              </div>
              <ol className="mt-6 space-y-3">
                {PARSE_STAGES.map((label, i) => (
                  <li key={label} className={cn("flex items-center gap-3 text-sm transition-opacity", i > stage && "opacity-40")}>
                    {i < stage ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : i === stage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-border" />
                    )}
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          ) : parsed ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Resume analysed</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {draft.resumeName}
                    {summary && ` · Found ${summary}`}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Next, you&apos;ll review each section. Anything we filled in is marked so you can check it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setSummary(null);
                    inputRef.current?.click();
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Replace
                </button>
              </div>
              <button
                type="button"
                onClick={onContinue}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
              >
                Review my details
              </button>
            </div>
          ) : (
            <label
              htmlFor="resume-input"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold">Drop your resume here, or click to browse</p>
              <p className="mt-1 text-sm text-muted-foreground">PDF only · up to 10MB</p>
            </label>
          )}

          {parseError && (
            <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-destructive">{parseError}</p>
                <button type="button" onClick={() => onMethod("MANUAL")} className="mt-1 font-semibold text-foreground underline-offset-4 hover:underline">
                  Fill in manually instead
                </button>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            id="resume-input"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ReviewCard({
  title,
  icon: Icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ElementType;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <button type="button" onClick={onEdit} className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
          Edit
        </button>
      </div>
      <div className="space-y-2 px-5 py-4">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value || "—"}</span>
    </div>
  );
}
