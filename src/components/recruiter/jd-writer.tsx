"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { JobFormValues } from "@/lib/jobs";
import { generateJobDescription } from "@/actions/jd-writer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PillGroup } from "@/components/onboarding/fields";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "startup", label: "Startup" },
] as const;

const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
] as const;

type Tone = (typeof TONES)[number]["value"];
type Length = (typeof LENGTHS)[number]["value"];

const plainText = (html: string) => html.replace(/<[^>]*>/g, "").trim();

/**
 * Drafts the job description from the rest of the form (plus the company
 * profile, added on the server). The draft replaces the editor content and
 * can be undone.
 */
export function JdWriter({
  values,
  onApply,
  disabled,
}: {
  values: JobFormValues;
  onApply: (html: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<Length>("standard");
  const [rewrite, setRewrite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasDraft = plainText(values.description).length >= 20;
  const titleReady = values.title.trim().length >= 3;
  const missing = [
    !values.skills.length && "must-have skills",
    !values.min_experience && "experience",
    !values.department && "department",
  ].filter(Boolean) as string[];

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateJobDescription({
        values,
        notes,
        tone,
        length,
        rewrite: rewrite && hasDraft,
      });
      if (res.error || !res.html) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setPrevious(values.description);
      onApply(res.html);
      setOpen(false);
    });
  };

  const undo = () => {
    if (previous === null) return;
    onApply(previous);
    setPrevious(null);
  };

  const busy = disabled || isPending;

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.03] sm:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Write with AI</span>
          <span className="block text-xs text-muted-foreground">
            Drafts a structured description from the details you&apos;ve filled in and your company profile.
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {previous !== null && !open && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/15 px-4 py-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            AI draft added below — review and edit it before publishing.
          </span>
          <button
            type="button"
            onClick={undo}
            disabled={busy}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            Undo
          </button>
        </div>
      )}

      {open && (
        <div className="space-y-4 border-t border-primary/15 px-4 py-4">
          <div className="space-y-1.5">
            <label htmlFor="jd-notes" className="text-sm font-medium">
              Anything the AI should know? <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="jd-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1500}
              disabled={busy}
              placeholder="e.g. Joins a 6-person payments team, owns the checkout SDK, 3-round interview (screening, technical, culture), 2 days a week in office."
              className="min-h-24"
            />
            <p className="text-[11px] text-muted-foreground">
              The AI only uses facts you give it — mention the team, key projects or hiring process here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tone</p>
              <PillGroup options={TONES} value={[tone]} onChange={([v]) => v && setTone(v as Tone)} />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Length</p>
              <PillGroup options={LENGTHS} value={[length]} onChange={([v]) => v && setLength(v as Length)} />
            </div>
          </div>

          {hasDraft && (
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox checked={rewrite} onCheckedChange={(v) => setRewrite(v === true)} disabled={busy} className="mt-0.5" />
              <span>
                Improve my current description
                <span className="block text-xs text-muted-foreground">
                  Keeps your content and restructures it. Otherwise a fresh draft replaces it (you can undo).
                </span>
              </span>
            </label>
          )}

          {!titleReady ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">Add a job title first — the AI writes around it.</p>
          ) : (
            missing.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Tip: add {missing.join(", ").replace(/, ([^,]*)$/, " and $1")} above for a sharper draft.
              </p>
            )
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={generate} disabled={busy || !titleReady} className="gap-1.5 rounded-full px-4">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isPending ? "Writing…" : rewrite && hasDraft ? "Improve description" : "Generate description"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
