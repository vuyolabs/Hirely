"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Handshake,
  Loader2,
  Search,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { signup } from "@/actions/auth";
import { SignupFormSchema } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { isFreeEmail } from "@/lib/india";
import { Button } from "@/components/ui/button";
import { ChoiceCard, Field, TextInput } from "@/components/onboarding/fields";
import { Accent, AuthHeading, PasswordInput } from "@/components/auth/auth-fields";
import { useZodForm } from "@/components/auth/use-zod-form";

type Role = "CANDIDATE" | "RECRUITER";

export function SignupForm({ initialRole }: { initialRole: Role | null }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [role, setRole] = useState<Role | null>(initialRole);
  const [choosing, setChoosing] = useState(initialRole === null);

  const v = state?.values ?? {};
  const [workStatus, setWorkStatus] = useState(v.workStatus || "");
  const [hiringFor, setHiringFor] = useState(v.hiringFor || "OWN_COMPANY");
  const [email, setEmail] = useState(v.email || "");

  const form = useZodForm(SignupFormSchema, state?.errors);
  const e = form.error;

  /* ---------- Step 1: choose a side ---------- */
  if (choosing || !role) {
    return (
      <div>
        <AuthHeading
          eyebrow="Create your account"
          title={
            <>
              Join <Accent>Hirely.</Accent>
            </>
          }
          description="Tell us which side of the table you're on — we'll tailor everything after this."
        />
        <div className="mt-8 grid gap-3" role="radiogroup">
          <ChoiceCard
            selected={role === "CANDIDATE"}
            onSelect={() => setRole("CANDIDATE")}
            icon={Search}
            title="I'm looking for a job"
            description="Build a profile, get matched on skills and track every application."
          />
          <ChoiceCard
            selected={role === "RECRUITER"}
            onSelect={() => setRole("RECRUITER")}
            icon={UsersRound}
            title="I'm hiring"
            description="Post roles, review pre-scored applicants and manage your pipeline."
          />
        </div>
        <Button
          type="button"
          disabled={!role}
          onClick={() => setChoosing(false)}
          className="mt-6 h-11 w-full gap-2 rounded-full font-semibold"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const isRecruiter = role === "RECRUITER";
  const personalEmail = isRecruiter && email.includes("@") && isFreeEmail(email);

  /* ---------- Step 2: details ---------- */
  return (
    <div>
      <button
        type="button"
        onClick={() => setChoosing(true)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {isRecruiter ? "Employer account" : "Job seeker account"} · Change
      </button>

      <AuthHeading
        title={
          isRecruiter ? (
            <>
              Start <Accent>hiring</Accent> on Hirely.
            </>
          ) : (
            <>
              Find work that <Accent>fits.</Accent>
            </>
          )
        }
        description={
          isRecruiter
            ? "Create your recruiter login. You'll add and verify your company's details next."
            : "Create your account. Next, upload a resume or fill in your profile manually."
        }
      />

      <form action={action} {...form.formProps} className="mt-8 space-y-5">
        <input type="hidden" name="role" value={role} />
        {!isRecruiter && <input type="hidden" name="workStatus" value={workStatus} />}
        {isRecruiter && <input type="hidden" name="hiringFor" value={hiringFor} />}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="firstName" error={e("firstName")}>
            <TextInput id="firstName" name="firstName" defaultValue={v.firstName} placeholder="Aarav" invalid={!!e("firstName")} autoComplete="given-name" required />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={e("lastName")}>
            <TextInput id="lastName" name="lastName" defaultValue={v.lastName} placeholder="Sharma" invalid={!!e("lastName")} autoComplete="family-name" required />
          </Field>
        </div>

        <Field
          label={isRecruiter ? "Official work email" : "Email address"}
          htmlFor="email"
          error={e("email")}
          hint={
            personalEmail ? (
              <span className="inline-flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Personal email domains slow down company verification. Use your company email if you can.
              </span>
            ) : isRecruiter ? (
              "Use your company domain — it speeds up verification."
            ) : undefined
          }
        >
          <TextInput
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            invalid={!!e("email")}
            placeholder={isRecruiter ? "you@company.com" : "you@example.com"}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Mobile number" htmlFor="phone" error={e("phone")} hint={isRecruiter ? undefined : "Recruiters will contact you on this number."}>
          <div className="flex">
            <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +91
            </span>
            <TextInput id="phone" name="phone" inputMode="numeric" defaultValue={v.phone} invalid={!!e("phone")} placeholder="98765 43210" autoComplete="tel-national" className="rounded-l-none" required />
          </div>
        </Field>

        {isRecruiter ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company name" htmlFor="companyName" error={e("companyName")}>
                <TextInput id="companyName" name="companyName" defaultValue={v.companyName} invalid={!!e("companyName")} placeholder="Acme Technologies" autoComplete="organization" required />
              </Field>
              <Field label="Your designation" htmlFor="jobTitle" error={e("jobTitle")}>
                <TextInput id="jobTitle" name="jobTitle" defaultValue={v.jobTitle} invalid={!!e("jobTitle")} placeholder="HR Manager" autoComplete="organization-title" required />
              </Field>
            </div>
            <Field label="You're hiring for">
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                <SegmentOption selected={hiringFor === "OWN_COMPANY"} onSelect={() => setHiringFor("OWN_COMPANY")} icon={Building2} label="Your company" />
                <SegmentOption selected={hiringFor === "CLIENTS"} onSelect={() => setHiringFor("CLIENTS")} icon={Handshake} label="Clients (agency)" />
              </div>
            </Field>
          </>
        ) : (
          <Field label="Work status" error={e("workStatus")}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              <SegmentOption selected={workStatus === "EXPERIENCED"} onSelect={() => {
                  setWorkStatus("EXPERIENCED");
                  form.clear("workStatus");
                }} icon={Briefcase} label="I'm experienced" invalid={!!e("workStatus")} />
              <SegmentOption selected={workStatus === "FRESHER"} onSelect={() => {
                  setWorkStatus("FRESHER");
                  form.clear("workStatus");
                }} icon={GraduationCap} label="I'm a fresher" invalid={!!e("workStatus")} />
            </div>
          </Field>
        )}

        <Field label="Password" htmlFor="password" error={e("password")}>
          <PasswordInput autoComplete="new-password" placeholder="Create a strong password" invalid={!!e("password")} related={[email]} showStrength />
        </Field>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
            <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--primary)]" required />
            <span>
              I agree to Hirely&apos;s Terms of Service and Privacy Policy
              {isRecruiter ? ", and confirm I'm hiring on behalf of a registered business." : "."}
            </span>
          </label>
          {e("terms") && <p className="mt-1.5 text-xs font-medium text-destructive">{e("terms")}</p>}
        </div>

        <Button type="submit" disabled={pending} className="h-11 w-full gap-2 rounded-full text-base font-semibold">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              {isRecruiter ? "Create employer account" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function SegmentOption({
  selected,
  onSelect,
  icon: Icon,
  label,
  invalid,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  label: string;
  invalid?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-all",
        selected
          ? "border-primary bg-primary/10 text-primary ring-3 ring-primary/10"
          : invalid
            ? "border-destructive/60 text-muted-foreground hover:text-foreground"
            : "border-input text-muted-foreground hover:border-foreground/25 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
