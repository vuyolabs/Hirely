"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

const links = [
  { href: "#demo", label: "Live demo" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#solutions", label: "Solutions" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ dashboardUrl }: { dashboardUrl: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border px-4 transition-all duration-300",
          scrolled || open
            ? "border-border/70 bg-background/75 shadow-lg shadow-black/5 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="inline-flex items-center">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggleButton />

          {dashboardUrl ? (
            <Link
              href={dashboardUrl}
              className={buttonVariants({ size: "sm", className: "rounded-full px-4" })}
            >
              Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "hidden rounded-full sm:inline-flex",
                })}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ size: "sm", className: "rounded-full px-4" })}
              >
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "md:hidden",
            })}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mx-auto mt-2 grid max-w-6xl gap-1 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-lg backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          {!dashboardUrl && (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
