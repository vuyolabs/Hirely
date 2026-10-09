"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const CONTENT = {
  candidates: {
    tab: "For job seekers",
    icon: Users,
    title: "Stop applying into the void.",
    body: "Upload once, get a structured profile, and see exactly where every application stands.",
    points: [
      "One-click resume upload with AI parsing",
      "Matches ranked by your real skills",
      "Live status timeline for every application",
      "Save jobs and set career preferences",
    ],
    cta: "Join as a candidate",
    href: "/signup?role=candidate",
    cards: [
      { icon: FileText, label: "Profile built", value: "from 1 PDF" },
      { icon: Bookmark, label: "Saved roles", value: "12" },
      { icon: CheckCircle2, label: "Status updates", value: "real-time" },
    ],
  },
  recruiters: {
    tab: "For recruiters",
    icon: Building2,
    title: "Screen with precision, not guesswork.",
    body: "Publish roles with required skills and review clean, comparable candidate summaries.",
    points: [
      "Post jobs with skill & experience requirements",
      "Pre-scored applicants, sorted by fit",
      "Pipeline stages with one-click advancement",
      "Audit trail on every decision",
    ],
    cta: "Start hiring",
    href: "/signup?role=recruiter",
    cards: [
      { icon: Filter, label: "Applicants pre-scored", value: "100%" },
      { icon: ClipboardList, label: "Pipeline stages", value: "5" },
      { icon: ShieldCheck, label: "Actions audited", value: "every one" },
    ],
  },
} as const;

type Audience = keyof typeof CONTENT;

export function AudienceSwitch() {
  const [audience, setAudience] = useState<Audience>("candidates");
  const c = CONTENT[audience];

  return (
    <div>
      <div className="mx-auto flex w-fit rounded-full border border-border bg-muted/60 p-1">
        {(Object.keys(CONTENT) as Audience[]).map((key) => {
          const Icon = CONTENT[key].icon;
          const active = key === audience;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setAudience(key)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {CONTENT[key].tab}
            </button>
          );
        })}
      </div>

      <div
        key={audience}
        className="mt-10 grid items-center gap-10 animate-in fade-in slide-in-from-bottom-3 duration-500 lg:grid-cols-2"
      >
        <div>
          <h3 className="font-brand text-3xl font-extrabold tracking-tight sm:text-4xl">
            {c.title}
          </h3>
          <p className="mt-4 text-muted-foreground">{c.body}</p>
          <ul className="mt-6 space-y-3">
            {c.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href={c.href}
            className={buttonVariants({
              size: "lg",
              className: "mt-8 h-11 rounded-full px-6 font-semibold",
            })}
          >
            {c.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {c.cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 lg:ml-[calc(var(--i)*2rem)]"
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-brand text-xl font-extrabold">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
