"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { login } from "@/actions/auth";
import { LoginFormSchema } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/onboarding/fields";
import { Accent, AuthHeading, PasswordInput } from "@/components/auth/auth-fields";
import { useZodForm } from "@/components/auth/use-zod-form";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const form = useZodForm(LoginFormSchema, state?.errors);
  const emailError = form.error("email");
  const passwordError = form.error("password");
  const [email, setEmail] = useState("");

  return (
    <div>
      <AuthHeading
        eyebrow="Sign in"
        title={
          <>
            Welcome <Accent>back.</Accent>
          </>
        }
        description="Sign in to your Hirely account — job seekers and employers use the same login."
      />

      <form action={action} {...form.formProps} className="mt-8 space-y-5">
        <Field label="Email address" htmlFor="email" error={emailError}>
          <TextInput
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            invalid={!!emailError}
            required
          />
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput invalid={!!passwordError} />
          {passwordError && (
            <p className="text-xs font-medium text-destructive">{passwordError}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full gap-2 rounded-full text-base font-semibold"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-6 text-sm">
        <Link
          href="/signup?role=candidate"
          className="rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <span className="block font-semibold">New job seeker?</span>
          <span className="text-xs text-muted-foreground">Create a free profile →</span>
        </Link>
        <Link
          href="/signup?role=recruiter"
          className="rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <span className="block font-semibold">Hiring?</span>
          <span className="text-xs text-muted-foreground">Create an employer account →</span>
        </Link>
      </div>
    </div>
  );
}
