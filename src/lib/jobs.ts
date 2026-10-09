import * as z from "zod"

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

/** Functional areas, modelled on the categories major Indian job boards use. */
export const JOB_DEPARTMENTS = [
  "Engineering - Software & QA",
  "Engineering - Hardware & Networks",
  "Data Science & Analytics",
  "IT & Information Security",
  "DevOps & Cloud",
  "Product Management",
  "UX, Design & Architecture",
  "Project & Program Management",
  "Sales & Business Development",
  "Marketing & Communication",
  "Customer Success, Service & Operations",
  "Finance & Accounting",
  "Banking, Insurance & Investments",
  "Human Resources",
  "Administration & Facilities",
  "Legal & Regulatory",
  "Procurement & Supply Chain",
  "Production, Manufacturing & Engineering",
  "Quality Assurance (Non-IT)",
  "Research & Development",
  "Healthcare & Life Sciences",
  "Teaching & Training",
  "Content, Editorial & Journalism",
  "Media Production & Entertainment",
  "Consulting",
  "Strategic & Top Management",
  "Retail & Merchandising",
  "Hospitality & Travel",
  "Construction & Site Engineering",
  "Energy & Mining",
  "Environment, Health & Safety",
  "Security Services",
  "Other",
] as const

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
] as const

export const EXPERIENCE_LEVELS = [
  { value: "ENTRY", label: "Entry level" },
  { value: "MID", label: "Mid level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead / Manager" },
] as const

export const WORK_MODES = [
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
] as const

export const EDUCATION_LEVELS = [
  "Any qualification",
  "10th pass",
  "12th pass",
  "Diploma",
  "Any graduate",
  "B.Tech / B.E.",
  "B.Com / BBA",
  "B.Sc / BCA",
  "Any postgraduate",
  "M.Tech / M.E.",
  "MBA / PGDM",
  "MCA / M.Sc",
  "CA / CS / ICWA",
  "Doctorate / PhD",
] as const

export const BENEFITS = [
  "Health insurance",
  "Provident fund",
  "Performance bonus",
  "Flexible hours",
  "Work from home allowance",
  "Paid time off",
  "Learning budget",
  "Stock options / ESOPs",
  "Parental leave",
  "Meal allowance",
  "Transport / cab",
  "Gym / wellness",
] as const

export const POPULAR_CITIES = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Noida",
  "Gurugram",
  "Kochi",
  "Jaipur",
]

/* Filter buckets */

export const SALARY_FILTERS = [
  { value: 3, label: "3+ LPA" },
  { value: 6, label: "6+ LPA" },
  { value: 10, label: "10+ LPA" },
  { value: 15, label: "15+ LPA" },
  { value: 25, label: "25+ LPA" },
  { value: 40, label: "40+ LPA" },
] as const

export const POSTED_FILTERS = [
  { value: 1, label: "Last 24 hours" },
  { value: 3, label: "Last 3 days" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
] as const

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const label = <T extends readonly { value: string; label: string }[]>(list: T, v: string) =>
  list.find((o) => o.value === v)?.label ?? v

export const employmentTypeLabel = (v: string) => label(EMPLOYMENT_TYPES, v)
export const experienceLevelLabel = (v: string) => label(EXPERIENCE_LEVELS, v)
export const workModeLabel = (v: string) => label(WORK_MODES, v)

const lpa = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}`

export function formatSalary(job: {
  salary_min?: number | null
  salary_max?: number | null
  salary_disclosed?: boolean
}) {
  const { salary_min: min, salary_max: max } = job
  if (job.salary_disclosed === false || (min == null && max == null)) return null
  if (min != null && max != null && min !== max) return `₹${lpa(min)}–${lpa(max)} LPA`
  return `₹${lpa((min ?? max)!)}${min != null && max == null ? "+" : ""} LPA`
}

export function formatExperience(job: { min_experience?: number | null; max_experience?: number | null }) {
  const min = job.min_experience ?? 0
  const max = job.max_experience
  if (max == null) return min === 0 ? "Any experience" : `${min}+ yrs`
  if (min === 0 && max === 0) return "Fresher"
  return `${min}–${max} yrs`
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
}

/** The single display string stored in Job.location for list views. */
export function deriveLocation(workMode: string, locations: string[]) {
  if (workMode === "REMOTE") return locations.length ? `Remote · ${locations.join(", ")}` : "Remote"
  const cities = locations.join(", ")
  return workMode === "HYBRID" ? `${cities} · Hybrid` : cities
}

/* ------------------------------------------------------------------ */
/* Validation (shared by the form and the server actions)              */
/* ------------------------------------------------------------------ */

const optionalNumber = (label: string, { min = 0, max = 1000, int = false } = {}) =>
  z
    .string()
    .trim()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max), {
      error: `${label} must be between ${min} and ${max}.`,
    })
    .refine((v) => !v || !int || Number.isInteger(Number(v)), {
      error: `${label} must be a whole number.`,
    })

export const JobFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { error: "Job title must be at least 3 characters." })
      .max(100, { error: "Keep the title under 100 characters." }),
    department: z.string().min(1, { error: "Select a department." }),
    employment_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
    experience_level: z.enum(["ENTRY", "MID", "SENIOR", "LEAD"]),
    openings: optionalNumber("Openings", { min: 1, max: 500, int: true }).refine((v) => !!v, {
      error: "How many people are you hiring?",
    }),

    work_mode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
    locations: z.array(z.string().trim().min(1)).max(10, { error: "Add up to 10 locations." }),

    min_experience: optionalNumber("Minimum experience", { max: 40, int: true }).refine((v) => !!v, {
      error: "Set the minimum experience (0 for freshers).",
    }),
    max_experience: optionalNumber("Maximum experience", { max: 40, int: true }),

    salary_min: optionalNumber("Minimum salary", { max: 500 }),
    salary_max: optionalNumber("Maximum salary", { max: 500 }),
    salary_disclosed: z.boolean(),

    skills: z
      .array(z.string().trim().min(1))
      .min(1, { error: "Add at least one must-have skill." })
      .max(20, { error: "Keep it to 20 must-have skills." }),
    nice_to_have_skills: z.array(z.string().trim().min(1)).max(20),

    description: z.string().refine((html) => html.replace(/<[^>]*>/g, "").trim().length >= 50, {
      error: "Describe the role in at least 50 characters.",
    }),
    education: z.string(),
    benefits: z.array(z.string()),

    resume_required: z.boolean(),
    application_deadline: z
      .string()
      .refine((v) => !v || new Date(v) > new Date(new Date().toDateString()), {
        error: "The deadline must be in the future.",
      }),
  })
  .superRefine((d, ctx) => {
    if (d.work_mode !== "REMOTE" && d.locations.length === 0) {
      ctx.addIssue({ code: "custom", path: ["locations"], message: "Add at least one city." })
    }
    if (d.max_experience && Number(d.max_experience) < Number(d.min_experience || 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["max_experience"],
        message: "Maximum can't be less than the minimum.",
      })
    }
    if (d.salary_min && d.salary_max && Number(d.salary_max) < Number(d.salary_min)) {
      ctx.addIssue({
        code: "custom",
        path: ["salary_max"],
        message: "Maximum can't be less than the minimum.",
      })
    }
    if (d.salary_disclosed && !d.salary_min && !d.salary_max) {
      ctx.addIssue({
        code: "custom",
        path: ["salary_min"],
        message: "Add a salary range, or choose not to disclose it.",
      })
    }
  })

export type JobFormValues = z.input<typeof JobFormSchema>
