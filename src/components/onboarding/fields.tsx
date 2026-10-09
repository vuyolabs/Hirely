"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, Plus, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  optional,
  aiFilled,
  className,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  /** Marks a value that came from resume parsing and needs a human check. */
  aiFilled?: boolean;
  className?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              Optional
            </span>
          )}
        </label>
        {aiFilled && <AiBadge />}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      title="Filled from your resume — please double-check"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      From resume
    </span>
  );
}

export const inputClass = "h-10 rounded-lg bg-background";

export function TextInput({
  invalid,
  className,
  ...props
}: React.ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <Input
      aria-invalid={invalid || undefined}
      className={cn(inputClass, className)}
      {...props}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

// Native options inherit nothing reliable across browsers; set both colours.
const OPTION_CLASS = "bg-popover text-popover-foreground";

export function Select({
  invalid,
  placeholder,
  options,
  className,
  ...props
}: Omit<React.ComponentProps<"select">, "children"> & {
  invalid?: boolean;
  placeholder?: string;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-background pr-9 pl-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          // Must stay opaque: browsers can't draw a translucent native menu and
          // fall back to white. This matches the look of dark:bg-input/30.
          "dark:bg-[color-mix(in_oklch,white_4.5%,var(--background))]",
          !props.value && "text-muted-foreground",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className={OPTION_CLASS}>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value} className={OPTION_CLASS}>
              {opt.label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Big selectable card used for either/or choices. */
export function ChoiceCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  badge,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-all",
        selected
          ? "border-primary ring-3 ring-primary/15"
          : "border-border hover:border-foreground/25 hover:bg-muted/40",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

/** Pill toggles, single or multiple selection. */
export function PillGroup({
  options,
  value,
  onChange,
  multiple,
  invalid,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role={multiple ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() =>
              onChange(
                multiple
                  ? on
                    ? value.filter((v) => v !== o.value)
                    : [...value, o.value]
                  : [o.value],
              )
            }
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-all active:scale-[0.97]",
              on
                ? "border-primary bg-primary/10 text-primary"
                : cn(
                    "bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                    invalid ? "border-destructive/60" : "border-border",
                  ),
            )}
          >
            {on && <Check className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Free-text chips — type and press Enter or comma. */
export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
  invalid,
  id,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  invalid?: boolean;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const fallbackId = useId();

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "");
    if (!tag) return;
    if (!value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft("");
  };

  const remaining = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-2.5">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-background p-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          invalid ? "border-destructive ring-3 ring-destructive/20" : "border-input",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 py-1 pr-1 pl-2 text-xs font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="rounded p-0.5 hover:bg-primary/15"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id ?? fallbackId}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder={value.length ? "" : placeholder}
          className="h-7 min-w-32 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...value, s])}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bordered card that groups one repeatable entry (a job, a degree…). */
export function EntryCard({
  title,
  subtitle,
  onRemove,
  aiFilled,
  children,
}: {
  title: string;
  subtitle?: string;
  onRemove: () => void;
  aiFilled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {aiFilled && <AiBadge />}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove entry"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function AddEntryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {children}
    </div>
  );
}
