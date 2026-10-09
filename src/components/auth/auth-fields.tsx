"use client";

import { useState, type ReactNode } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { TextInput } from "@/components/onboarding/fields";
import { PASSWORD_RULES, measurePassword } from "@/lib/password";

export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 font-brand text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return (
    <span className="font-display text-[1.08em] font-normal italic tracking-normal text-primary">
      {children}
    </span>
  );
}

export function PasswordInput({
  id = "password",
  name = "password",
  autoComplete = "current-password",
  placeholder = "Enter your password",
  invalid,
  showStrength,
  related,
  onValueChange,
}: {
  id?: string;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  invalid?: boolean;
  showStrength?: boolean;
  /** Personal info (email, name) the password shouldn't contain. */
  related?: string[];
  onValueChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <TextInput
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-10"
          invalid={invalid}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onValueChange?.(e.target.value);
          }}
          aria-describedby={showStrength ? `${id}-strength` : undefined}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && (
        <PasswordStrengthMeter id={`${id}-strength`} password={value} related={related} />
      )}
    </div>
  );
}

const SCORE_STYLES = [
  { bar: "bg-destructive", text: "text-destructive" },
  { bar: "bg-destructive", text: "text-destructive" },
  { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { bar: "bg-lime-500", text: "text-lime-600 dark:text-lime-400" },
  { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
];

export function PasswordStrengthMeter({
  id,
  password,
  related,
}: {
  id?: string;
  password: string;
  related?: string[];
}) {
  const strength = measurePassword(password, related);
  const style = SCORE_STYLES[strength.score];

  return (
    <div id={id} aria-live="polite" className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                password && i <= Math.max(strength.score, 1) ? style.bar : "bg-muted",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "w-16 text-right text-xs font-semibold",
            password ? style.text : "text-muted-foreground",
          )}
        >
          {password ? strength.label : "Strength"}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              {ok ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
              {rule.label}
            </li>
          );
        })}
      </ul>

      {password && strength.tip && (
        <p className="text-xs text-muted-foreground">{strength.tip}</p>
      )}
    </div>
  );
}
