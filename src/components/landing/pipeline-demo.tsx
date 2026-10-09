"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck,
  Check,
  FileSearch,
  PartyPopper,
  Send,
  Star,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    key: "APPLIED",
    label: "Applied",
    icon: Send,
    candidate: "Application sent with your parsed profile.",
    recruiter: "New applicant lands in the pipeline, pre-scored.",
  },
  {
    key: "SCREENING",
    label: "Screening",
    icon: FileSearch,
    candidate: "A recruiter opened your profile.",
    recruiter: "Structured summary — skills, experience, gaps.",
  },
  {
    key: "SHORTLISTED",
    label: "Shortlisted",
    icon: Star,
    candidate: "You made the shortlist. You'll know instantly.",
    recruiter: "One click moves them forward, with notes.",
  },
  {
    key: "INTERVIEW",
    label: "Interview",
    icon: CalendarCheck,
    candidate: "Interview stage — no more guessing.",
    recruiter: "Every stage change is logged for the team.",
  },
  {
    key: "HIRED",
    label: "Hired",
    icon: PartyPopper,
    candidate: "Offer accepted. Welcome aboard.",
    recruiter: "Role filled. Full audit trail kept.",
  },
] as const;

export function PipelineDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!playing || hovering) return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % STAGES.length),
      2400,
    );
    return () => clearInterval(id);
  }, [playing, hovering]);

  const current = STAGES[step];

  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      {/* Stage stepper */}
      <div className="rounded-3xl border border-border/80 bg-card p-3">
        <div className="mb-1 flex items-center justify-between px-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stages
          </p>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {playing ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {playing ? "Pause" : "Play"}
          </button>
        </div>
        <ol className="space-y-1">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
                      active &&
                        "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30",
                      done &&
                        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      !active && !done && "border-border text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  {active && playing && !hovering && (
                    <span
                      key={step}
                      className="absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-primary/50"
                      style={{ animation: "pipeline-progress 2.4s linear" }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <style>{`@keyframes pipeline-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      </div>

      {/* Two-sided view */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Candidate phone-ish card */}
        <div className="flex flex-col rounded-3xl border border-border/80 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Candidate sees
          </p>

          <div
            key={`n-${step}`}
            className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                Status: {current.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {current.candidate}
              </p>
            </div>
          </div>

          <ol className="relative mt-5 space-y-3 border-l border-border pl-5">
            {STAGES.map((s, i) => (
              <li
                key={s.key}
                className={cn(
                  "relative text-xs transition-opacity duration-500",
                  i > step && "opacity-35",
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[25px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card transition-colors duration-500",
                    i < step && "bg-emerald-500",
                    i === step && "bg-primary ring-4 ring-primary/20",
                    i > step && "bg-muted-foreground/40",
                  )}
                />
                <span className="font-medium">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Recruiter board */}
        <div className="flex flex-col rounded-3xl border border-border/80 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recruiter sees
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-xs font-bold text-primary-foreground">
                AM
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Alex Morgan</p>
                <p className="text-xs text-muted-foreground">
                  Frontend Engineer
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                92%
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-[width] duration-700 ease-out"
                style={{ width: `${((step + 1) / STAGES.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Stage {step + 1} of {STAGES.length} · {current.label}
            </p>
          </div>

          <p
            key={`r-${step}`}
            className="mt-4 text-sm leading-relaxed text-muted-foreground animate-in fade-in duration-500"
          >
            {current.recruiter}
          </p>

          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {["React", "TypeScript", "CSS", "Figma"].map((s) => (
              <span
                key={s}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
