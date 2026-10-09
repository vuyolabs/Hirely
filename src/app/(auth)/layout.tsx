import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Check, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

const proof = [
  {
    icon: Sparkles,
    title: "Skill-first matching",
    body: "Roles ranked by what you can actually do.",
  },
  {
    icon: BadgeCheck,
    title: "Verified employers only",
    body: "Every company is checked against its GST registration.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your profile is shared only with roles you apply to.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel — always dark */}
      <aside className="dark relative isolate hidden overflow-hidden bg-zinc-950 text-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden
          className="bg-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_80%_60%_at_20%_10%,black,transparent)]"
        />
        <div
          aria-hidden
          className="absolute -bottom-48 -left-24 -z-10 h-[420px] w-[520px] rounded-full bg-primary/40 blur-[130px]"
        />

        <Link href="/" className="w-fit">
          <Logo size="lg" />
        </Link>

        <div className="max-w-md">
          <h1 className="font-brand text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] xl:text-6xl">
            Hire for{" "}
            <span className="font-display text-[1.08em] font-normal italic tracking-normal text-teal-300">
              skills,
            </span>
            <br />
            not keywords.
          </h1>

          {/* Product glimpse */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-sm font-bold text-white">
                N
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Frontend Engineer</p>
                <p className="text-xs text-muted-foreground">Northwind · Bengaluru · Verified</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
                92% match
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["React", "TypeScript", "CSS"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-teal-200">
                  <Check className="h-3 w-3" />
                  {s}
                </span>
              ))}
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground line-through">
                Figma
              </span>
            </div>
          </div>

          <ul className="mt-10 space-y-5">
            {proof.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-teal-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hirely
        </p>
      </aside>

      {/* Form side */}
      <section className="relative flex flex-col px-4 py-5 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <ThemeToggleButton />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-500">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
