"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";

import { requestPasswordReset, type ForgotPasswordResult } from "@/actions/password-reset";
import { ForgotPasswordSchema } from "@/lib/definitions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, TextInput } from "@/components/onboarding/fields";
import { Accent, AuthHeading } from "@/components/auth/auth-fields";
import { ResendCodeButton } from "@/components/auth/resend-code-button";
import { useZodForm } from "@/components/auth/use-zod-form";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);
  const [pending, start] = useTransition();
  const form = useZodForm(ForgotPasswordSchema, result?.errors);

  if (sentTo) {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" />
        </span>
        <AuthHeading
          title={
            <>
              Check your <Accent>inbox.</Accent>
            </>
          }
          description={
            <>
              If an account exists for <strong className="text-foreground">{sentTo}</strong>, we&apos;ve
              sent a 6-digit code to reset your password. It expires in 15 minutes.
            </>
          }
        />

        <Link
          href={`/reset-password?email=${encodeURIComponent(sentTo)}`}
          className={buttonVariants({
            className: "mt-8 h-11 w-full gap-2 rounded-full text-base font-semibold",
          })}
        >
          Enter the code
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Didn&apos;t get it?</p>
          <p className="mt-1">Check spam or promotions, or make sure the address above is right.</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <ResendCodeButton email={sentTo} startCoolingDown />
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Account recovery"
        title={
          <>
            Forgot your <Accent>password?</Accent>
          </>
        }
        description="Enter the email you signed up with and we'll send you a 6-digit code to reset it."
      />

      <form
        {...form.formProps}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.formProps.onSubmit(e)) return;
          start(async () => {
            const res = await requestPasswordReset({ email });
            setResult(res);
            if (res.ok && res.email) setSentTo(res.email);
          });
        }}
        className="mt-8 space-y-5"
      >
        <Field label="Email address" htmlFor="email" error={form.error("email")}>
          <TextInput
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            invalid={!!form.error("email")}
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
              Sending code…
            </>
          ) : (
            "Send reset code"
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
