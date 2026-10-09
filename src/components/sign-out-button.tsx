"use client";

import { useTransition, type ReactNode } from "react";
import { Loader2, LogOut } from "lucide-react";

import { logout } from "@/actions/auth";

/**
 * Clears the session, then does a full page load of /login so no cached
 * signed-in pages survive in the client router.
 */
export function useSignOut() {
  const [pending, start] = useTransition();

  const signOut = () =>
    start(async () => {
      await logout();
      // Intentionally a full load, not router.push: it drops every cached
      // signed-in RSC payload from the client router.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    });

  return { signOut, pending };
}

export function SignOutButton({
  className,
  children = "Sign out",
  iconClassName = "h-4 w-4",
}: {
  className?: string;
  children?: ReactNode;
  iconClassName?: string;
}) {
  const { signOut, pending } = useSignOut();

  return (
    <button type="button" onClick={signOut} disabled={pending} className={className}>
      {pending ? (
        <Loader2 className={`${iconClassName} animate-spin`} />
      ) : (
        <LogOut className={iconClassName} />
      )}
      {pending ? "Signing out…" : children}
    </button>
  );
}
