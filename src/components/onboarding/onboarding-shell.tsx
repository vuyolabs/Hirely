"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export type OnboardingStep = {
  key: string;
  title: string;
  description: string;
};

export function OnboardingShell({
  steps,
  current,
  furthest,
  onStepClick,
  eyebrow,
  title,
  description,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  pending,
  hideFooter,
  railNote,
  children,
}: {
  steps: OnboardingStep[];
  current: number;
  /** Highest step index the user has reached; earlier steps are clickable. */
  furthest: number;
  onStepClick: (index: number) => void;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  pending?: boolean;
  hideFooter?: boolean;
  railNote?: ReactNode;
  children: ReactNode;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const progress = ((current + 1) / steps.length) * 100;

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
  }, [current]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ---------- Desktop rail ---------- */}
      <aside className="sticky top-0 hidden h-screen w-[340px] shrink-0 flex-col border-r border-border bg-muted/30 px-8 py-8 lg:flex">
        <Logo size="md" />

        <nav aria-label="Onboarding progress" className="mt-14 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Setup · {Math.round(progress)}%
          </p>
          <ol className="mt-6">
            {steps.map((step, i) => {
              const done = i < current;
              const active = i === current;
              const reachable = i <= furthest && !active;
              return (
                <li key={step.key} className="relative pb-7 last:pb-0">
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-9 left-[15px] h-[calc(100%-2.5rem)] w-px",
                        done ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => onStepClick(i)}
                    aria-current={active ? "step" : undefined}
                    className="group flex w-full items-start gap-4 text-left disabled:cursor-default"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                        active &&
                          "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15",
                        done && "border-primary bg-primary/10 text-primary",
                        !active && !done && "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="pt-1">
                      <span
                        className={cn(
                          "block text-sm font-semibold transition-colors",
                          !active && !done && "text-muted-foreground",
                          reachable && "group-hover:text-primary",
                        )}
                      >
                        {step.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {railNote && (
          <div className="mb-6 rounded-2xl border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">
            {railNote}
          </div>
        )}

        <div className="flex items-center justify-between">
          <SignOutButton
            iconClassName="h-3.5 w-3.5"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Save &amp; sign out
          </SignOutButton>
          <ThemeToggleButton />
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo size="sm" />
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Step {current + 1} of {steps.length}
              </span>
              <ThemeToggleButton />
            </div>
          </div>
          <div className="h-0.5 bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <main className="flex-1 px-4 pt-10 pb-32 sm:px-8 lg:px-14 lg:pt-16">
          <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-20">
            <div key={current} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow ?? `Step ${current + 1} of ${steps.length}`}
              </p>
              <h1 className="mt-3 font-brand text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                {title}
              </h1>
              {description && (
                <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
              <div className="mt-10">{children}</div>
            </div>
          </div>
        </main>

        {!hideFooter && (
          <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-xl lg:left-[340px]">
            <div className="mx-auto flex h-18 max-w-2xl items-center justify-between gap-3 px-4 sm:px-0">
              {onBack ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  disabled={pending}
                  className="h-11 gap-2 rounded-full px-5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {onNext && (
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled || pending}
                  className="h-11 min-w-36 gap-2 rounded-full px-6 font-semibold"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {nextLabel}
                  {!pending && <ArrowRight className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

/** Serif-italic accent used in step titles. */
export function TitleAccent({ children }: { children: ReactNode }) {
  return (
    <span className="font-display text-[1.08em] font-normal italic tracking-normal text-primary">
      {children}
    </span>
  );
}
