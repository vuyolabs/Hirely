"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, RotateCw } from "lucide-react";

import { requestPasswordReset } from "@/actions/password-reset";

const COOLDOWN_SECONDS = 60;

/** Re-sends a reset code, with the same 60s cooldown the server enforces. */
export function ResendCodeButton({
  email,
  startCoolingDown,
}: {
  email: string;
  /** Start in cooldown, e.g. right after the first code was sent. */
  startCoolingDown?: boolean;
}) {
  const [remaining, setRemaining] = useState(startCoolingDown ? COOLDOWN_SECONDS : 0);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const disabled = pending || remaining > 0 || !email;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        start(async () => {
          await requestPasswordReset({ email });
          setSent(true);
          setRemaining(COOLDOWN_SECONDS);
        })
      }
      className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RotateCw className="h-3.5 w-3.5" />
      )}
      {remaining > 0
        ? `${sent ? "Sent! " : ""}Resend in ${remaining}s`
        : "Resend code"}
    </button>
  );
}
