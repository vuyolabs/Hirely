import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BellRing,
  Bot,
  Building2,
  Check,
  Clock,
  FileCheck,
  FileText,
  MapPin,
  MousePointerClick,
  ShieldCheck,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/dal";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { LandingNav } from "@/components/landing/landing-nav";
import { MatchDemo } from "@/components/landing/match-demo";
import { PipelineDemo } from "@/components/landing/pipeline-demo";
import { AudienceSwitch } from "@/components/landing/audience-switch";
import { Faq } from "@/components/landing/faq";
import { CountUp, Reveal } from "@/components/landing/reveal";

const STEPS = [
  {
    n: "01",
    title: "Upload a resume",
    body: "Drop in any PDF. Skills, experience and education are parsed into a clean, editable profile in seconds.",
  },
  {
    n: "02",
    title: "Match on real skills",
    body: "Roles are ranked by how well your capabilities cover what the job actually requires — not keyword overlap.",
  },
  {
    n: "03",
    title: "Follow every step",
    body: "Each time a recruiter moves you forward, your timeline updates. No more applying into the void.",
  },
];

export default async function Home() {
  const user = await getUser();

  const [totalJobs, totalRecruiters, totalCandidates, featuredJobs] =
    await Promise.all([
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count({ where: { role: "RECRUITER" } }),
      prisma.user.count({ where: { role: "CANDIDATE" } }),
      prisma.job.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { created_at: "desc" },
        take: 10,
        include: { recruiter: { select: { company_name: true } } },
      }),
    ]);

  const dashboardUrl = !user
    ? null
    : user.role === "ADMIN"
      ? "/admin"
      : user.role === "RECRUITER"
        ? "/recruiter"
        : "/candidate";

  const stats = [
    { value: totalJobs, label: "Open roles right now" },
    { value: totalCandidates, label: "Candidates with structured profiles" },
    { value: totalRecruiters, label: "Hiring teams on Hirely" },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-foreground selection:bg-primary/20">
      <LandingNav dashboardUrl={dashboardUrl} />

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative isolate pt-32 pb-16 sm:pt-44 sm:pb-24">
          <div
            aria-hidden
            className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
          />
          <div
            aria-hidden
            className="absolute top-[38rem] left-1/2 -z-10 h-[420px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/12 blur-[140px]"
          />

          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="text-center">
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/70 py-1 pr-3 pl-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  New
                </span>
                AI resume parsing is live
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </a>

              <h1 className="mx-auto mt-7 max-w-4xl font-brand text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-7xl lg:text-[5.5rem]">
                Hire for <Accent>skills,</Accent>
                <br className="hidden sm:block" /> not keywords.
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Hirely turns any resume into a structured profile, ranks the
                roles that genuinely fit, and keeps candidates and recruiters
                on one transparent pipeline.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={dashboardUrl ?? "/signup"}
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "h-12 w-full gap-2 rounded-full px-7 text-base font-semibold shadow-lg shadow-primary/20 sm:w-auto",
                  })}
                >
                  {dashboardUrl ? "Open dashboard" : "Find your match"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup?role=recruiter"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "h-12 w-full gap-2 rounded-full bg-background/70 px-7 text-base font-semibold sm:w-auto",
                  })}
                >
                  <Building2 className="h-4 w-4" />
                  Post a role
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                {[
                  "Free for candidates",
                  "No credit card",
                  "Set up in minutes",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Product window */}
            <Reveal delay={150} className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
              <div id="demo" className="absolute -top-28" />

              <FloatingNote
                icon={FileText}
                title="Resume parsed"
                body="14 skills · 2.4s"
                className="-left-14 top-24"
              />
              <FloatingNote
                icon={BellRing}
                title="Moved to Shortlisted"
                body="Candidate notified instantly"
                className="-right-14 bottom-20"
                delay="-3s"
              />

              <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_30px_80px_-20px_color-mix(in_oklch,var(--primary)_35%,transparent)] ring-8 ring-muted/50">
                <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="mx-auto hidden w-full max-w-xs items-center justify-center rounded-md border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground sm:flex">
                    app.hirely.com/matches
                  </div>
                  <span className="hidden w-[46px] sm:block" />
                </div>
                <MatchDemo />
              </div>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                It&apos;s live — toggle skills and watch the matches re-rank
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------- Live jobs marquee ---------- */}
        {featuredJobs.length > 0 && (
          <section className="border-y border-border py-5">
            <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 sm:px-6">
              <p className="hidden shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Hiring now
              </p>
              <div className="marquee relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div
                  className="animate-marquee flex w-max gap-3"
                  style={
                    {
                      "--marquee-duration": `${Math.max(featuredJobs.length * 6, 30)}s`,
                    } as React.CSSProperties
                  }
                >
                  {[...featuredJobs, ...featuredJobs].map((job, i) => (
                    <Link
                      key={`${job.id}-${i}`}
                      href={dashboardUrl ? "/candidate/jobs" : "/signup"}
                      aria-hidden={i >= featuredJobs.length}
                      tabIndex={i >= featuredJobs.length ? -1 : undefined}
                      className="group flex shrink-0 items-center gap-3 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 transition-colors hover:border-primary/50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(job.recruiter.company_name || "C")[0]}
                      </span>
                      <span className="text-sm font-semibold">{job.title}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location || "Remote"}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------- Manifesto + stats ---------- */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[3fr_2fr] lg:gap-20">
            <Reveal>
              <SectionLabel>Why Hirely</SectionLabel>
              <p className="mt-6 font-brand text-3xl font-bold leading-[1.15] tracking-[-0.03em] sm:text-[2.75rem]">
                A résumé is a <Accent className="text-muted-foreground">format.</Accent>{" "}
                Skills are the <Accent>signal.</Accent>{" "}
                <span className="text-muted-foreground">
                  We built Hirely so the best-fit candidate wins — not the one
                  who formatted their PDF best.
                </span>
              </p>
            </Reveal>
            <Reveal delay={100}>
              <dl className="divide-y divide-border border-y border-border">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-baseline justify-between gap-6 py-6"
                  >
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                    <dd className="font-display text-5xl leading-none tracking-tight sm:text-6xl">
                      <CountUp value={s.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="max-w-2xl">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-4 font-brand text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                From PDF to offer, in <Accent>three</Accent> steps.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 100}>
                  <div className="relative border-t border-foreground/80 pt-6">
                    <span className="font-display text-6xl leading-none text-primary">
                      {step.n}
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Features bento ---------- */}
        <section id="features" className="scroll-mt-24 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <SectionLabel>Capabilities</SectionLabel>
                <h2 className="mt-4 font-brand text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                  Built for <Accent>both sides</Accent> of the hiring table.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Candidates get clarity. Recruiters get comparable, pre-scored
                profiles. Admins keep it all honest.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-6">
              <Reveal className="md:col-span-4">
                <FeatureCard
                  icon={Bot}
                  title="AI resume parsing"
                  body="Skills, experience, education and highlights pulled from any PDF layout into a clean, editable profile."
                  className="h-full"
                >
                  <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                      {[90, 70, 80, 55, 65].map((w, i) => (
                        <div
                          key={i}
                          className="h-1.5 rounded-full bg-muted-foreground/20"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["React", "5 yrs", "B.Sc CS", "SQL", "Team lead"].map(
                        (t) => (
                          <span
                            key={t}
                            className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                          >
                            {t}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </FeatureCard>
              </Reveal>
              <Reveal delay={80} className="md:col-span-2">
                <FeatureCard
                  icon={Target}
                  title="Skill-first matching"
                  body="Candidates are scored on required capabilities and level — not on who stuffed the most keywords."
                  className="h-full"
                />
              </Reveal>
              <Reveal className="md:col-span-2">
                <FeatureCard
                  icon={FileCheck}
                  title="Live timelines"
                  body="Every status change shows up instantly on the candidate's application timeline."
                  className="h-full"
                />
              </Reveal>
              <Reveal delay={80} className="md:col-span-2">
                <FeatureCard
                  icon={Clock}
                  title="Faster time-to-hire"
                  body="Qualification previews and one-click stage moves cut screening time dramatically."
                  className="h-full"
                />
              </Reveal>
              <Reveal delay={160} className="md:col-span-2">
                <FeatureCard
                  icon={ShieldCheck}
                  title="Moderation & audits"
                  body="Admins moderate jobs and users, with an audit log behind every action."
                  className="h-full"
                />
              </Reveal>
              <Reveal className="md:col-span-6">
                <FeatureCard
                  icon={Award}
                  title="Structured, comparable profiles"
                  body="Every candidate in the same clean format, so recruiters compare qualifications, not résumé design."
                  horizontal
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- Pipeline ---------- */}
        <section
          id="pipeline"
          className="scroll-mt-24 border-y border-border bg-muted/30 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <SectionLabel center>Transparent pipeline</SectionLabel>
              <h2 className="mt-4 font-brand text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                One pipeline. <Accent>Both sides</Accent> see it.
              </h2>
              <p className="mt-5 text-muted-foreground">
                When a recruiter moves an applicant forward, the candidate knows
                right away. Click a stage or let it play.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-14">
              <PipelineDemo />
            </Reveal>
          </div>
        </section>

        {/* ---------- Audiences ---------- */}
        <section id="solutions" className="scroll-mt-24 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto mb-12 max-w-2xl text-center">
              <SectionLabel center>Solutions</SectionLabel>
              <h2 className="mt-4 font-brand text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                Made for <Accent>your</Accent> side of the table.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <AudienceSwitch />
            </Reveal>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-border bg-muted/30 py-24 sm:py-32"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[2fr_3fr] lg:gap-16">
            <Reveal>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="mt-4 font-brand text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                Questions, <Accent>answered.</Accent>
              </h2>
              <p className="mt-5 text-muted-foreground">
                Anything else? Create an account and look around — it&apos;s
                free for candidates.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="px-4 py-24 sm:px-6 sm:py-32">
          <Reveal className="mx-auto max-w-6xl">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-20 text-center text-white ring-1 ring-white/10 sm:px-16 sm:py-28">
              <div
                aria-hidden
                className="bg-grid absolute inset-0 -z-10 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
                style={{ "--border": "white" } as React.CSSProperties}
              />
              <div
                aria-hidden
                className="absolute -bottom-40 left-1/2 -z-10 h-80 w-[700px] -translate-x-1/2 rounded-full bg-primary/50 blur-[120px]"
              />
              <h2 className="mx-auto max-w-3xl font-brand text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
                Your next role — or next hire — is a{" "}
                <span className="font-display font-normal italic tracking-normal text-teal-300">
                  match
                </span>{" "}
                away.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-white/65">
                Free for candidates. Set up in minutes for teams.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-zinc-950 transition-colors hover:bg-white/90"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-7 text-base font-semibold transition-colors hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="overflow-hidden border-t border-border pt-14 text-sm text-muted-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo size="md" />
            <p className="max-w-xs text-sm leading-relaxed">
              Skill-first hiring and application tracking for modern teams.
            </p>
          </div>
          <FooterCol
            title="Candidates"
            links={[
              ["Browse jobs", "/signup"],
              ["Upload resume", "/signup"],
              ["Track applications", "/signup"],
            ]}
          />
          <FooterCol
            title="Employers"
            links={[
              ["Post a job", "/signup?role=recruiter"],
              ["Candidate pipelines", "/signup?role=recruiter"],
            ]}
          />
          <FooterCol
            title="Platform"
            links={[
              ["Live demo", "#demo"],
              ["Pipeline", "#pipeline"],
              ["FAQ", "#faq"],
            ]}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border px-4 pt-6 text-xs sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Hirely. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
        <p
          aria-hidden
          className="pointer-events-none mt-8 -mb-[0.22em] text-center font-brand text-[24vw] leading-none font-extrabold tracking-[-0.06em] text-foreground/[0.04] select-none lg:text-[17rem]"
        >
          Hirely
        </p>
      </footer>
    </div>
  );
}

/** Editorial serif-italic accent inside a heavy sans headline. */
function Accent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-display text-[1.08em] font-normal italic tracking-normal text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SectionLabel({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
        center && "justify-center",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}

function FloatingNote({
  icon: Icon,
  title,
  body,
  className,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-float absolute z-10 hidden items-center gap-3 rounded-2xl border border-border bg-background/90 p-3 pr-4 shadow-xl shadow-black/5 backdrop-blur-xl xl:flex",
        className,
      )}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  className,
  horizontal,
  children,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  className?: string;
  horizontal?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/[0.04] sm:p-8",
        horizontal && "md:flex md:items-center md:gap-6",
        className,
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3
          className={cn(
            "mt-6 text-lg font-semibold tracking-tight",
            horizontal && "md:mt-0",
          )}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        {children}
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition-colors hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
