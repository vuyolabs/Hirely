"use client";

import { useMemo, useState } from "react";
import { Check, FileText, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "SQL",
  "AWS",
  "Figma",
  "CSS",
  "PyTorch",
  "Tableau",
] as const;

type Skill = (typeof SKILLS)[number];

const JOBS: {
  id: string;
  title: string;
  company: string;
  hue: number;
  skills: Skill[];
}[] = [
  {
    id: "fe",
    title: "Frontend Engineer",
    company: "Northwind",
    hue: 292,
    skills: ["React", "TypeScript", "CSS", "Figma"],
  },
  {
    id: "fs",
    title: "Full-stack Developer",
    company: "Lumen Labs",
    hue: 200,
    skills: ["React", "Node.js", "SQL", "AWS"],
  },
  {
    id: "da",
    title: "Data Analyst",
    company: "Brightwave",
    hue: 150,
    skills: ["Python", "SQL", "Tableau"],
  },
  {
    id: "ml",
    title: "ML Engineer",
    company: "Orbital",
    hue: 30,
    skills: ["Python", "PyTorch", "AWS", "SQL"],
  },
  {
    id: "pd",
    title: "Product Designer",
    company: "Canvas Co.",
    hue: 340,
    skills: ["Figma", "CSS", "React"],
  },
];

const ROW = 76; // row height + gap, px

export function MatchDemo() {
  const [selected, setSelected] = useState<Set<Skill>>(
    () => new Set<Skill>(["React", "TypeScript", "SQL"]),
  );

  const ranked = useMemo(() => {
    const scored = JOBS.map((job) => {
      const hits = job.skills.filter((s) => selected.has(s)).length;
      return { ...job, score: Math.round((hits / job.skills.length) * 100) };
    });
    const order = [...scored].sort((a, b) => b.score - a.score);
    return scored.map((job) => ({
      ...job,
      rank: order.findIndex((o) => o.id === job.id),
    }));
  }, [selected]);

  const toggle = (skill: Skill) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });

  return (
    <div className="relative grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Resume / skills panel */}
      <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">alex_resume.pdf</p>
            <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Parsed in 2.4s
            </p>
          </div>
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your skills · tap to edit
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {SKILLS.map((skill) => {
            const on = selected.has(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggle(skill)}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-95",
                  on
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {on ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                {skill}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
          Matches re-rank instantly from your real skills, not keyword
          stuffing.
        </div>
      </div>

      {/* Ranked jobs */}
      <div
        className="relative"
        style={{ height: JOBS.length * ROW - 8 }}
        aria-live="polite"
      >
        {ranked.map((job) => (
          <div
            key={job.id}
            className="absolute inset-x-0 top-0 flex h-[68px] items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ transform: `translateY(${job.rank * ROW}px)` }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, oklch(0.65 0.18 ${job.hue}), oklch(0.5 0.2 ${job.hue + 30}))`,
              }}
            >
              {job.company[0]}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{job.title}</p>
                {job.rank === 0 && job.score > 0 && (
                  <span className="hidden shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline dark:text-emerald-400">
                    Best match
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 overflow-hidden">
                <span className="mr-1 shrink-0 text-xs text-muted-foreground">
                  {job.company}
                </span>
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "hidden shrink-0 rounded px-1.5 text-[10px] font-medium transition-colors sm:inline",
                      selected.has(s)
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground/70 line-through",
                    )}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <ScoreRing score={job.score} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const color =
    score >= 75
      ? "text-emerald-500"
      : score >= 40
        ? "text-primary"
        : "text-muted-foreground/60";

  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          className="stroke-muted"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className={cn(
            "transition-[stroke-dashoffset,color] duration-700",
            color,
          )}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums">
        {score}%
      </span>
    </div>
  );
}
