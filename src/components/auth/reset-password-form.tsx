"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

import { resetPassword, type ResetPasswordResult } from "@/actions/password-reset";
import { ResetPasswordSchema } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Field, TextInput } from "@/components/onboarding/fields";
import { Accent, AuthHeading, PasswordInput } from "@/components/auth/auth-fields";
import { ResendCodeButton } from "@/components/auth/resend-code-button";
import { useZodForm } from "@/components/auth/use-zod-form";

export function ResetPasswordForm({
  initialEmail,
  initialCode,
}: {
  initialEmail: string;
  initialCode: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [editingEmail, setEditingEmail] = useState(!initialEmail);
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<ResetPasswordResult | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const form = useZodForm(ResetPasswordSchema, result?.errors);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => router.push("/login"), 4000);
    return () => clearTimeout(id);
  }, [done, router]);

  if (done) {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <AuthHeading
          title={
            <>
              Password <Accent>updated.</Accent>
            </>
          }
          description="You can now sign in with your new password. Taking you to sign in…"
        />
        <Link
          href="/login"
          className={buttonVariants({
            className: "mt-8 h-11 w-full gap-2 rounded-full text-base font-semibold",
          })}
        >
          Sign in now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const codeError = form.error("code");

  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <KeyRound className="h-6 w-6" />
      </span>
      <AuthHeading
        title={
          <>
            Set a new <Accent>password.</Accent>
          </>
        }
        description="Enter the 6-digit code we emailed you, then choose a new password."
      />

      <form
        {...form.formProps}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.formProps.onSubmit(e)) return;
          const data = new FormData(e.currentTarget);
          start(async () => {
            const res = await resetPassword({
              email,
              code,
              password: String(data.get("password") ?? ""),
              confirmPassword: String(data.get("confirmPassword") ?? ""),
            });
            setResult(res);
            if (res.ok) setDone(true);
          });
        }}
        className="mt-8 space-y-6"
      >
        {editingEmail ? (
          <Field label="Email address" htmlFor="email" error={form.error("email")}>
            <TextInput
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              invalid={!!form.error("email")}
            />
          </Field>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
            <input type="hidden" name="email" value={email} />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">Resetting password for</span>
              <span className="block truncate font-medium">{email}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingEmail(true)}
              className="shrink-0 text-xs font-semibold text-primary hover:underline"
            >
              Change
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="code" className="text-sm font-medium">
              Verification code
            </label>
            {email && <ResendCodeButton email={email} />}
          </div>
          <InputOTP
            id="code"
            name="code"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(v) => {
              setCode(v);
              form.clear("code");
            }}
            autoFocus={!initialCode && !!initialEmail}
            containerClassName="w-full"
          >
            <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  aria-invalid={!!codeError || undefined}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-background font-mono text-lg font-semibold first:rounded-lg first:border-l last:rounded-lg",
                    codeError && "border-destructive",
                  )}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {codeError && <p className="text-xs font-medium text-destructive">{codeError}</p>}
        </div>

        <Field label="New password" htmlFor="password" error={form.error("password")}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Create a strong password"
            invalid={!!form.error("password")}
            related={[email]}
            showStrength
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword" error={form.error("confirmPassword")}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            invalid={!!form.error("confirmPassword")}
          />
        </Field>

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full gap-2 rounded-full text-base font-semibold"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
