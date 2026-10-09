"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  BadgeCheck,
  Building2,
  CircleCheck,
  Clock,
  Handshake,
  Info,
  Landmark,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type * as z from "zod";

import { cn } from "@/lib/utils";
import {
  COMPANY_TYPES,
  INDIAN_STATES,
  companyTypeInfo,
  normalizeId,
  panFromGstin,
  stateFromGstin,
  validateGstin,
} from "@/lib/india";
import {
  COMPANY_SIZES,
  CompanyStepSchema,
  DEPARTMENTS,
  HIRING_VOLUMES,
  INDUSTRIES,
  LegalStepSchema,
  RecruiterStepSchema,
  fieldErrors,
} from "@/lib/onboarding";
import {
  completeRecruiterOnboarding,
  lookupCompanyByGstin,
  type CompanyLookup,
} from "@/actions/onboarding";
import { Checkbox } from "@/components/ui/checkbox";
import {
  OnboardingShell,
  TitleAccent,
  type OnboardingStep,
} from "@/components/onboarding/onboarding-shell";
import {
  ChoiceCard,
  ErrorBanner,
  Field,
  FormSection,
  Select,
  TextArea,
  TextInput,
} from "@/components/onboarding/fields";

const STEPS: OnboardingStep[] = [
  { key: "company", title: "Company profile", description: "What candidates will see" },
  { key: "legal", title: "Legal & tax details", description: "GSTIN, PAN and registered address" },
  { key: "recruiter", title: "About you", description: "Your role and contact details" },
  { key: "review", title: "Review & submit", description: "Send for verification" },
];

type Draft = {
  step: number;
  furthest: number;
  company: {
    legalName: string;
    displayName: string;
    companyType: string;
    industry: string;
    companySize: string;
    foundedYear: string;
    website: string;
    description: string;
  };
  legal: {
    gstin: string;
    pan: string;
    registrationNumber: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    declaration: boolean;
  };
  recruiter: {
    jobTitle: string;
    department: string;
    phone: string;
    linkedinUrl: string;
    hiringFor: "OWN_COMPANY" | "CLIENTS";
    hiringVolume: string;
  };
};

type Section = "company" | "legal" | "recruiter";

export function RecruiterOnboarding({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    firstName: string;
    lastName: string;
    companyName: string;
    jobTitle: string;
    phone: string;
    hiringFor: "OWN_COMPANY" | "CLIENTS";
  };
}) {
  const storageKey = `hirely-employer-onboarding:${userId}`;

  const [draft, setDraft] = useState<Draft>({
    step: 0,
    furthest: 0,
    company: {
      legalName: initial.companyName,
      displayName: initial.companyName,
      companyType: "",
      industry: "",
      companySize: "",
      foundedYear: "",
      website: "",
      description: "",
    },
    legal: {
      gstin: "",
      pan: "",
      registrationNumber: "",
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
      declaration: false,
    },
    recruiter: {
      jobTitle: initial.jobTitle,
      department: "",
      phone: initial.phone,
      linkedinUrl: "",
      hiringFor: initial.hiringFor,
      hiringVolume: "",
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existing, setExisting] = useState<CompanyLookup>({ exists: false });
  const [submitting, startSubmit] = useTransition();
  const restored = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Draft;
        // Never restore the legal declaration — it must be ticked fresh.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
        setDraft((d) => ({ ...d, ...parsed, legal: { ...parsed.legal, declaration: false } }));
      }
    } catch {}
    restored.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {}
  }, [draft, storageKey]);

  // Look up the GSTIN once it's well-formed, so a second recruiter joins
  // the existing company instead of registering a duplicate.
  const gstin = normalizeId(draft.legal.gstin);
  const gstinValid = gstin.length === 15 && !validateGstin(gstin);
  useEffect(() => {
    if (!gstinValid) return;
    let cancelled = false;
    lookupCompanyByGstin(gstin).then((r) => {
      if (!cancelled) setExisting(r);
    });
    return () => {
      cancelled = true;
    };
  }, [gstin, gstinValid]);
  const joining = gstinValid && existing.exists;

  const { step } = draft;
  const typeInfo = companyTypeInfo(draft.company.companyType);

  const goTo = (next: number) => {
    setErrors({});
    setDraft((d) => ({ ...d, step: next, furthest: Math.max(d.furthest, next) }));
  };

  function set<S extends Section, K extends keyof Draft[S]>(
    section: S,
    key: K,
    value: Draft[S][K],
  ) {
    setErrors((e) => {
      const rest = { ...e };
      delete rest[`${section}.${String(key)}`];
      return rest;
    });
    setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: value } }));
  }

  const onGstinChange = (raw: string) => {
    const value = normalizeId(raw).slice(0, 15);
    set("legal", "gstin", value);
    if (value.length === 15 && !validateGstin(value)) {
      setDraft((d) => ({
        ...d,
        legal: {
          ...d.legal,
          gstin: value,
          pan: panFromGstin(value),
          state: stateFromGstin(value) ?? d.legal.state,
        },
      }));
    }
  };

  const check = (schema: z.ZodType, value: unknown, prefix: string) => {
    const r = schema.safeParse(value);
    if (r.success) return {};
    return Object.fromEntries(
      Object.entries(fieldErrors(r.error)).map(([k, v]) => [`${prefix}.${k}`, v]),
    );
  };

  const legalPayload = () => ({ ...draft.legal, companyType: draft.company.companyType });

  const validateStep = (i: number) => {
    switch (STEPS[i].key) {
      case "company":
        return check(CompanyStepSchema, draft.company, "company");
      case "legal":
        return check(LegalStepSchema, legalPayload(), "legal");
      case "recruiter":
        return check(RecruiterStepSchema, draft.recruiter, "recruiter");
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
      const res = await completeRecruiterOnboarding({
        company: draft.company,
        legal: legalPayload(),
        recruiter: draft.recruiter,
      });
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

  const err = (k: string) => errors[k];

  const header = {
    company: {
      title: (
        <>
          Tell us about your <TitleAccent>company.</TitleAccent>
        </>
      ),
      description:
        draft.recruiter.hiringFor === "CLIENTS"
          ? "You're hiring for clients, so enter your agency's own details here — not a client's."
          : "This becomes your public employer page. Candidates see it next to every job you post.",
    },
    legal: {
      title: (
        <>
          Verify your <TitleAccent>business.</TitleAccent>
        </>
      ),
      description:
        "Hirely only lists jobs from registered businesses, which keeps fake listings out. We check these details against government records before your company is verified.",
    },
    recruiter: {
      title: (
        <>
          A bit about <TitleAccent>you.</TitleAccent>
        </>
      ),
      description: "Candidates see your name and designation on the jobs you post.",
    },
    review: {
      title: (
        <>
          Ready for <TitleAccent>verification.</TitleAccent>
        </>
      ),
      description: "Check your details once more. You can start drafting jobs while we review.",
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
      nextLabel={step === STEPS.length - 1 ? (submitting ? "Submitting…" : "Submit for verification") : "Continue"}
      pending={submitting}
      railNote={
        <span className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Your GSTIN, PAN and registration number are used only to verify your business. They&apos;re never shown to candidates.
          </span>
        </span>
      }
    >
      {step === 0 && (
        <div className="space-y-10">
          <FormSection title="Identity">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Registered legal name" htmlFor="legalName" error={err("company.legalName")} hint="Exactly as on your GST certificate." className="sm:col-span-2">
                <TextInput id="legalName" value={draft.company.legalName} invalid={!!err("company.legalName")} onChange={(e) => set("company", "legalName", e.target.value)} placeholder="e.g. Acme Technologies Private Limited" />
              </Field>
              <Field label="Brand / display name" htmlFor="displayName" error={err("company.displayName")} hint="What candidates know you as.">
                <TextInput id="displayName" value={draft.company.displayName} invalid={!!err("company.displayName")} onChange={(e) => set("company", "displayName", e.target.value)} placeholder="e.g. Acme" />
              </Field>
              <Field label="Company type" htmlFor="companyType" error={err("company.companyType")}>
                <Select id="companyType" value={draft.company.companyType} invalid={!!err("company.companyType")} onChange={(e) => set("company", "companyType", e.target.value)} placeholder="Select type" options={COMPANY_TYPES} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Profile">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Industry" htmlFor="industry" error={err("company.industry")}>
                <Select id="industry" value={draft.company.industry} invalid={!!err("company.industry")} onChange={(e) => set("company", "industry", e.target.value)} placeholder="Select industry" options={INDUSTRIES} />
              </Field>
              <Field label="Company size" htmlFor="companySize" error={err("company.companySize")}>
                <Select id="companySize" value={draft.company.companySize} invalid={!!err("company.companySize")} onChange={(e) => set("company", "companySize", e.target.value)} placeholder="Number of employees" options={COMPANY_SIZES.map((s) => ({ value: s, label: `${s} employees` }))} />
              </Field>
              <Field label="Year founded" htmlFor="foundedYear" optional error={err("company.foundedYear")}>
                <TextInput id="foundedYear" inputMode="numeric" maxLength={4} value={draft.company.foundedYear} invalid={!!err("company.foundedYear")} onChange={(e) => set("company", "foundedYear", e.target.value.replace(/\D/g, ""))} placeholder="2015" />
              </Field>
              <Field label="Website" htmlFor="website" optional error={err("company.website")}>
                <TextInput id="website" value={draft.company.website} invalid={!!err("company.website")} onChange={(e) => set("company", "website", e.target.value)} placeholder="acme.com" />
              </Field>
              <Field label="About the company" htmlFor="description" optional error={err("company.description")} className="sm:col-span-2" hint={`${draft.company.description.length}/1000`}>
                <TextArea id="description" rows={4} maxLength={1000} value={draft.company.description} onChange={(e) => set("company", "description", e.target.value)} placeholder="What you build, your mission, and what it's like to work with you." />
              </Field>
            </div>
          </FormSection>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-10">
          <FormSection title="Tax registration">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="GSTIN"
                htmlFor="gstin"
                error={err("legal.gstin")}
                className="sm:col-span-2"
                hint={
                  gstinValid ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <CircleCheck className="h-3.5 w-3.5" />
                      Valid format · {stateFromGstin(gstin)}
                    </span>
                  ) : (
                    "15-character GST Identification Number, e.g. 29ABCDE1234F1Z5."
                  )
                }
              >
                <TextInput id="gstin" value={draft.legal.gstin} invalid={!!err("legal.gstin")} onChange={(e) => onGstinChange(e.target.value)} placeholder="29ABCDE1234F1Z5" className="font-mono tracking-wider uppercase" autoComplete="off" spellCheck={false} />
              </Field>

              {joining && existing.exists && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm sm:col-span-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold">{existing.displayName} is already on Hirely.</span>{" "}
                    <span className="text-muted-foreground">
                      You&apos;ll be added as a recruiter for {existing.legalName}
                      {existing.status === "VERIFIED" ? ", which is already verified" : ""}. The company profile you entered
                      in the previous step won&apos;t replace theirs.
                    </span>
                  </p>
                </div>
              )}

              <Field label="Company PAN" htmlFor="pan" error={err("legal.pan")} hint="Auto-filled from your GSTIN.">
                <TextInput id="pan" value={draft.legal.pan} invalid={!!err("legal.pan")} onChange={(e) => set("legal", "pan", normalizeId(e.target.value).slice(0, 10))} placeholder="ABCDE1234F" className="font-mono tracking-wider uppercase" autoComplete="off" spellCheck={false} />
              </Field>

              {typeInfo?.registration && (
                <Field
                  label={typeInfo.registration === "CIN" ? "Corporate Identification Number (CIN)" : "LLP Identification Number (LLPIN)"}
                  htmlFor="registrationNumber"
                  error={err("legal.registrationNumber")}
                  hint={typeInfo.registration === "CIN" ? "21 characters, from your MCA certificate." : "e.g. AAB-1234"}
                >
                  <TextInput id="registrationNumber" value={draft.legal.registrationNumber} invalid={!!err("legal.registrationNumber")} onChange={(e) => set("legal", "registrationNumber", normalizeId(e.target.value).slice(0, 21))} placeholder={typeInfo.registration === "CIN" ? "U72200KA2015PTC123456" : "AAB-1234"} className="font-mono tracking-wider uppercase" autoComplete="off" spellCheck={false} />
                </Field>
              )}
            </div>
          </FormSection>

          <FormSection title="Registered address" description="As it appears on your GST registration.">
            <div className="grid gap-5 sm:grid-cols-6">
              <Field label="Address" htmlFor="addressLine" error={err("legal.addressLine")} className="sm:col-span-6">
                <TextInput id="addressLine" value={draft.legal.addressLine} invalid={!!err("legal.addressLine")} onChange={(e) => set("legal", "addressLine", e.target.value)} placeholder="Building, street, area" autoComplete="street-address" />
              </Field>
              <Field label="City" htmlFor="city" error={err("legal.city")} className="sm:col-span-2">
                <TextInput id="city" value={draft.legal.city} invalid={!!err("legal.city")} onChange={(e) => set("legal", "city", e.target.value)} autoComplete="address-level2" />
              </Field>
              <Field label="State" htmlFor="state" error={err("legal.state")} className="sm:col-span-2">
                <Select id="state" value={draft.legal.state} invalid={!!err("legal.state")} onChange={(e) => set("legal", "state", e.target.value)} placeholder="Select state" options={INDIAN_STATES} />
              </Field>
              <Field label="PIN code" htmlFor="pincode" error={err("legal.pincode")} className="sm:col-span-2">
                <TextInput id="pincode" inputMode="numeric" maxLength={6} value={draft.legal.pincode} invalid={!!err("legal.pincode")} onChange={(e) => set("legal", "pincode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" />
              </Field>
            </div>
          </FormSection>

          <div>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4 text-sm leading-relaxed",
                err("legal.declaration") ? "border-destructive/60" : "border-border",
              )}
            >
              <Checkbox
                checked={draft.legal.declaration}
                onCheckedChange={(v) => set("legal", "declaration", v === true)}
                className="mt-0.5"
              />
              <span>
                I confirm I&apos;m authorised to register <strong>{draft.company.legalName || "this company"}</strong> on Hirely, and that these details are accurate. I understand false information will lead to account suspension.
              </span>
            </label>
            {err("legal.declaration") && (
              <p className="mt-1.5 text-xs font-medium text-destructive">{err("legal.declaration")}</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-10">
          <FormSection title="Hiring for">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
              <ChoiceCard
                selected={draft.recruiter.hiringFor === "OWN_COMPANY"}
                onSelect={() => set("recruiter", "hiringFor", "OWN_COMPANY")}
                icon={Building2}
                title="My own company"
                description="I'm an in-house recruiter, HR or founder."
              />
              <ChoiceCard
                selected={draft.recruiter.hiringFor === "CLIENTS"}
                onSelect={() => set("recruiter", "hiringFor", "CLIENTS")}
                icon={Handshake}
                title="My clients"
                description="I work at a staffing or recruitment agency."
              />
            </div>
          </FormSection>

          <FormSection title="Your role">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Designation" htmlFor="jobTitle" error={err("recruiter.jobTitle")}>
                <TextInput id="jobTitle" value={draft.recruiter.jobTitle} invalid={!!err("recruiter.jobTitle")} onChange={(e) => set("recruiter", "jobTitle", e.target.value)} placeholder="e.g. Talent Acquisition Lead" autoComplete="organization-title" />
              </Field>
              <Field label="Department" htmlFor="department" error={err("recruiter.department")}>
                <Select id="department" value={draft.recruiter.department} invalid={!!err("recruiter.department")} onChange={(e) => set("recruiter", "department", e.target.value)} placeholder="Select department" options={DEPARTMENTS} />
              </Field>
              <Field label="Mobile number" htmlFor="phone" error={err("recruiter.phone")}>
                <div className="flex">
                  <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                  <TextInput id="phone" inputMode="numeric" value={draft.recruiter.phone} invalid={!!err("recruiter.phone")} onChange={(e) => set("recruiter", "phone", e.target.value)} className="rounded-l-none" autoComplete="tel-national" />
                </div>
              </Field>
              <Field label="Hiring volume" htmlFor="hiringVolume" error={err("recruiter.hiringVolume")}>
                <Select id="hiringVolume" value={draft.recruiter.hiringVolume} invalid={!!err("recruiter.hiringVolume")} onChange={(e) => set("recruiter", "hiringVolume", e.target.value)} placeholder="Roughly how many hires?" options={HIRING_VOLUMES} />
              </Field>
              <Field label="LinkedIn profile" htmlFor="linkedinUrl" optional error={err("recruiter.linkedinUrl")} hint="Helps candidates trust who they're talking to." className="sm:col-span-2">
                <TextInput id="linkedinUrl" value={draft.recruiter.linkedinUrl} invalid={!!err("recruiter.linkedinUrl")} onChange={(e) => set("recruiter", "linkedinUrl", e.target.value)} placeholder="linkedin.com/in/your-name" />
              </Field>
            </div>
          </FormSection>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {submitError && <ErrorBanner>{submitError}</ErrorBanner>}

          <ReviewCard title="Company" icon={Building2} onEdit={() => goTo(0)}>
            {joining && existing.exists ? (
              <Row label="Joining" value={`${existing.displayName} (already registered)`} />
            ) : (
              <>
                <Row label="Legal name" value={draft.company.legalName} />
                <Row label="Brand" value={draft.company.displayName} />
                <Row label="Type" value={typeInfo?.label ?? ""} />
                <Row label="Industry" value={draft.company.industry} />
                <Row label="Size" value={`${draft.company.companySize} employees`} />
                {draft.company.website && <Row label="Website" value={draft.company.website} />}
              </>
            )}
          </ReviewCard>

          <ReviewCard title="Legal & tax" icon={Landmark} onEdit={() => goTo(1)}>
            <Row label="GSTIN" value={gstin} mono />
            <Row label="PAN" value={draft.legal.pan} mono />
            {typeInfo?.registration && <Row label={typeInfo.registration} value={draft.legal.registrationNumber} mono />}
            <Row label="Address" value={`${draft.legal.addressLine}, ${draft.legal.city}, ${draft.legal.state} ${draft.legal.pincode}`} />
          </ReviewCard>

          <ReviewCard title="You" icon={UserRound} onEdit={() => goTo(2)}>
            <Row label="Name" value={`${initial.firstName} ${initial.lastName}`} />
            <Row label="Designation" value={`${draft.recruiter.jobTitle} · ${draft.recruiter.department}`} />
            <Row label="Mobile" value={`+91 ${draft.recruiter.phone}`} />
            <Row label="Hiring for" value={draft.recruiter.hiringFor === "CLIENTS" ? "Clients (agency)" : "Own company"} />
          </ReviewCard>

          <section className="rounded-2xl border border-border bg-muted/30 p-5">
            <h3 className="text-sm font-semibold">What happens next</h3>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { icon: CircleCheck, title: "Submitted", body: "Your dashboard unlocks right away." },
                { icon: Clock, title: "Under review", body: "We verify your GSTIN and registration, usually within 1–2 business days." },
                { icon: BadgeCheck, title: "Verified", body: "A verified badge appears on your company and every job." },
              ].map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-3">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", i === 0 ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </OnboardingShell>
  );
}

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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 break-words", mono && "font-mono tracking-wide")}>{value || "—"}</span>
    </div>
  );
}
