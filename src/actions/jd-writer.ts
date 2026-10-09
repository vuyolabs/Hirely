"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import {
  employmentTypeLabel,
  experienceLevelLabel,
  formatExperience,
  formatSalary,
  workModeLabel,
} from "@/lib/jobs";
import {
  JD_LENGTHS,
  JD_TONES,
  renderJobDescription,
  writeJobDescription,
} from "@/lib/ai/jd-writer";

export type JdWriterResult = { html?: string; error?: string };

const text = (max: number) => z.string().trim().max(max);
const list = (maxItems: number) => z.array(text(80)).max(maxItems);

const JdRequestSchema = z.object({
  values: z.object({
    title: text(100).min(3, { error: "Add a job title first — the AI writes around it." }),
    department: text(120),
    employment_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
    experience_level: z.enum(["ENTRY", "MID", "SENIOR", "LEAD"]),
    openings: text(4),
    work_mode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
    locations: list(10),
    min_experience: text(3),
    max_experience: text(3),
    salary_min: text(8),
    salary_max: text(8),
    salary_disclosed: z.boolean(),
    skills: list(20),
    nice_to_have_skills: list(20),
    education: text(80),
    benefits: list(15),
    application_deadline: text(20),
    description: z.string().max(30_000),
  }),
  notes: text(1500),
  tone: z.enum(JD_TONES),
  length: z.enum(JD_LENGTHS),
  /** Improve the existing description instead of starting fresh. */
  rewrite: z.boolean(),
});

export type JdRequest = z.input<typeof JdRequestSchema>;

/* Simple per-recruiter limit. In-memory, so it is per server instance. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 15;
const recentCalls = new Map<string, number[]>();

function rateLimited(userId: string) {
  const now = Date.now();
  const calls = (recentCalls.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (calls.length >= MAX_PER_WINDOW) {
    recentCalls.set(userId, calls);
    return true;
  }
  recentCalls.set(userId, [...calls, now]);
  return false;
}

function htmlToText(html: string) {
  return html
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|li|h[1-6]|div|blockquote|pre)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, 6000);
}

export async function generateJobDescription(input: unknown): Promise<JdWriterResult> {
  const session = await verifyRecruiter();

  const parsed = JdRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Some job details look invalid." };
  }
  const { values, notes, tone, length, rewrite } = parsed.data;

  const currentDraft = rewrite ? htmlToText(values.description) : "";
  if (rewrite && currentDraft.length < 20) {
    return { error: "There's no draft to rewrite yet — generate a fresh one instead." };
  }

  if (!process.env.GROQ_API_KEY) {
    return { error: "The AI writer isn't configured on this server." };
  }
  if (rateLimited(session.userId)) {
    return { error: "You've generated a lot of drafts in a short time. Please wait a few minutes." };
  }

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
    select: {
      company_name: true,
      company: {
        select: { display_name: true, industry: true, company_size: true, city: true, description: true },
      },
    },
  });
  if (!recruiter) return { error: "Recruiter profile not found." };

  const num = (v: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);
  const salary = values.salary_disclosed
    ? formatSalary({ salary_min: num(values.salary_min), salary_max: num(values.salary_max) })
    : null;

  try {
    const draft = await writeJobDescription({
      role: {
        title: values.title,
        department: values.department || null,
        employmentType: employmentTypeLabel(values.employment_type),
        seniority: experienceLevelLabel(values.experience_level),
        openings: num(values.openings),
        workMode: workModeLabel(values.work_mode),
        locations: values.locations,
        experience: values.min_experience
          ? formatExperience({
              min_experience: Number(values.min_experience),
              max_experience: num(values.max_experience),
            })
          : "Not specified",
        salary,
        mustHaveSkills: values.skills,
        niceToHaveSkills: values.nice_to_have_skills,
        education: values.education || null,
        benefits: values.benefits,
        applicationDeadline: values.application_deadline || null,
      },
      company: {
        name: recruiter.company?.display_name ?? recruiter.company_name,
        industry: recruiter.company?.industry ?? null,
        size: recruiter.company?.company_size ?? null,
        city: recruiter.company?.city ?? null,
        about: recruiter.company?.description ?? null,
      },
      notes,
      tone,
      length,
      currentDraft: currentDraft || null,
    });

    const html = renderJobDescription(draft);
    if (html.replace(/<[^>]*>/g, "").trim().length < 50) {
      return { error: "The AI returned an incomplete draft. Please try again." };
    }
    return { html };
  } catch (error) {
    console.error("JD writer failed:", error);
    return { error: "The AI writer is unavailable right now. Please try again in a moment." };
  }
}
