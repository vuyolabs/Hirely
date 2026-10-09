"use client";

import { useState, type FocusEvent, type FormEvent } from "react";
import type * as z from "zod";

type ServerErrors = Partial<Record<string, string[] | undefined>> | undefined;

function collect(form: HTMLFormElement) {
  const data: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") data[key] = value;
  });
  return data;
}

function flatten(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Validates a native <form> against a zod schema in the browser:
 * a field is checked when it loses focus, re-checked as it's corrected,
 * and every field is checked on submit (which is blocked if invalid).
 * Server-returned errors are shown until the user edits that field.
 */
export function useZodForm(schema: z.ZodType, serverErrors?: ServerErrors) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Adopt fresh server errors whenever the action returns new ones.
  const [lastServer, setLastServer] = useState<ServerErrors>(serverErrors);
  if (serverErrors !== lastServer) {
    setLastServer(serverErrors);
    if (serverErrors) {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(serverErrors)) if (v?.[0]) next[k] = v[0];
      setErrors(next);
    }
  }

  const validate = (form: HTMLFormElement) => {
    const result = schema.safeParse(collect(form));
    return result.success ? {} : flatten(result.error);
  };

  const fieldName = (target: EventTarget) =>
    (target as HTMLInputElement).name || undefined;

  return {
    error: (name: string) => errors[name],

    /** Remove one field's error, e.g. after a custom control changes. */
    clear: (name: string) =>
      setErrors((e) => {
        if (!(name in e)) return e;
        const rest = { ...e };
        delete rest[name];
        return rest;
      }),

    formProps: {
      noValidate: true,

      onBlur: (e: FocusEvent<HTMLFormElement>) => {
        const name = fieldName(e.target);
        if (!name) return;
        const nextTouched = new Set(touched).add(name);
        setTouched(nextTouched);
        const all = validate(e.currentTarget);
        setErrors((prev) => {
          const next = { ...prev };
          for (const key of nextTouched) {
            if (all[key]) next[key] = all[key];
            else delete next[key];
          }
          return next;
        });
      },

      onChange: (e: FormEvent<HTMLFormElement>) => {
        const name = fieldName(e.target);
        if (!name) return;
        const all = validate(e.currentTarget);
        setErrors((prev) => {
          // Only re-check fields that are already showing an error, or
          // that depend on this one (confirmPassword after password).
          const keys = Object.keys(prev).filter(
            (k) => k === name || (name === "password" && k === "confirmPassword"),
          );
          if (!keys.length) return prev;
          const next = { ...prev };
          for (const k of keys) {
            if (all[k]) next[k] = all[k];
            else delete next[k];
          }
          return next;
        });
      },

      onSubmit: (e: FormEvent<HTMLFormElement>) => {
        const all = validate(e.currentTarget);
        if (Object.keys(all).length) {
          e.preventDefault();
          setErrors(all);
          setTouched(new Set(Object.keys(all)));
          const first = e.currentTarget.querySelector<HTMLElement>(
            Object.keys(all)
              .map((k) => `[name="${k}"]:not([type="hidden"])`)
              .join(","),
          );
          first?.focus();
          return false;
        }
        return true;
      },
    },
  };
}
