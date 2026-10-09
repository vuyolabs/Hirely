import * as z from "zod"

import {
  COMPANY_TYPE_VALUES,
  INDIAN_STATES,
  isValidMobile,
  normalizeId,
  normalizeMobile,
  panFromGstin,
  validateGstin,
  validatePan,
  validatePincode,
  validateRegistrationNumber,
} from "@/lib/india"

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

export const INDUSTRIES = [
  "IT Services & Consulting",
  "Software Product",
  "Internet / E-commerce",
  "Fintech / Banking",
  "Financial Services",
  "Healthcare / Pharma",
  "Education / EdTech",
  "Manufacturing",
  "Retail / FMCG",
  "Telecom",
  "Media & Entertainment",
  "Logistics / Supply Chain",
  "Real Estate / Construction",
  "Automotive",
  "Energy / Utilities",
  "Recruitment / Staffing",
  "Government / Public Sector",
  "Non-profit",
  "Other",
]

export const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1,000",
  "1,001–5,000",
  "5,000+",
]

export const HIRING_VOLUMES = ["1–5 hires / year", "6–20 hires / year", "21–100 hires / year", "100+ hires / year"]

export const DEPARTMENTS = [
  "Human Resources / Talent Acquisition",
  "Engineering",
  "Founders / Leadership",
  "Operations",
  "Sales & Marketing",
  "Finance",
  "Other",
]

export const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
] as const

export const WORK_MODES = [
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
] as const

export const NOTICE_PERIODS = [
  "Immediate",
  "15 days or less",
  "1 month",
  "2 months",
  "3 months",
  "Serving notice period",
]

/* ------------------------------------------------------------------ */
/* Recruiter / company onboarding                                      */
/* ------------------------------------------------------------------ */

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => !v || /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(v),
    { error: "Enter a valid URL." },
  )
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))

export const CompanyStepSchema = z.object({
  legalName: z.string().trim().min(2, { error: "Legal name is required." }).max(150),
  displayName: z.string().trim().min(2, { error: "Brand name is required." }).max(80),
  companyType: z.enum(COMPANY_TYPE_VALUES, {
    error: "Select your company type.",
  }),
  industry: z.string().min(1, { error: "Select an industry." }),
  companySize: z.string().min(1, { error: "Select a company size." }),
  foundedYear: z
    .string()
    .trim()
    .refine(
      (v) => !v || (/^\d{4}$/.test(v) && +v >= 1800 && +v <= new Date().getFullYear()),
      { error: "Enter a valid year." },
    ),
  website: optionalUrl,
  description: z.string().trim().max(1000, { error: "Keep it under 1,000 characters." }),
})

export const LegalStepSchema = z
  .object({
    companyType: z.string(),
    gstin: z.string().transform(normalizeId),
    pan: z.string().transform(normalizeId),
    registrationNumber: z.string().transform(normalizeId),
    addressLine: z.string().trim().min(5, { error: "Enter the registered address." }).max(250),
    city: z.string().trim().min(2, { error: "City is required." }),
    state: z.string().refine((s) => INDIAN_STATES.includes(s), { error: "Select a state." }),
    pincode: z.string().trim(),
    declaration: z.literal(true, {
      error: "Please confirm you're authorised to register this company.",
    }),
  })
  .superRefine((d, ctx) => {
    const issue = (path: string, message: string | null) =>
      message && ctx.addIssue({ code: "custom", path: [path], message })

    const gstinError = validateGstin(d.gstin)
    issue("gstin", gstinError)
    issue("pan", validatePan(d.pan, d.companyType))
    if (!gstinError && panFromGstin(d.gstin) !== d.pan) {
      issue("pan", "PAN doesn't match the PAN inside your GSTIN.")
    }
    issue("registrationNumber", validateRegistrationNumber(d.registrationNumber, d.companyType))
    issue("pincode", validatePincode(d.pincode))
  })

export const RecruiterStepSchema = z.object({
  jobTitle: z.string().trim().min(2, { error: "Your designation is required." }),
  department: z.string().min(1, { error: "Select your department." }),
  phone: z
    .string()
    .trim()
    .refine(isValidMobile, { error: "Enter a valid 10-digit mobile number." })
    .transform(normalizeMobile),
  linkedinUrl: optionalUrl.refine((v) => !v || /linkedin\.com\//i.test(v), {
    error: "Enter a LinkedIn profile URL.",
  }),
  hiringFor: z.enum(["OWN_COMPANY", "CLIENTS"]),
  hiringVolume: z.string().min(1, { error: "Select your hiring volume." }),
})

export const RecruiterOnboardingSchema = z.object({
  company: CompanyStepSchema,
  legal: LegalStepSchema,
  recruiter: RecruiterStepSchema,
})

export type RecruiterOnboardingInput = z.input<typeof RecruiterOnboardingSchema>

/* ------------------------------------------------------------------ */
/* Candidate onboarding                                                */
/* ------------------------------------------------------------------ */

export const CandidateBasicsSchema = z
  .object({
    firstName: z.string().trim().min(2, { error: "First name is required." }),
    lastName: z.string().trim().min(1, { error: "Last name is required." }),
    phone: z
      .string()
      .trim()
      .refine(isValidMobile, { error: "Enter a valid 10-digit mobile number." })
      .transform(normalizeMobile),
    location: z.string().trim().min(2, { error: "Your current city is required." }),
    headline: z
      .string()
      .trim()
      .min(5, { error: "Add a short headline, e.g. “Frontend engineer · React”." })
      .max(120),
    summary: z.string().trim().max(2000),
    workStatus: z.enum(["EXPERIENCED", "FRESHER"], { error: "Select your work status." }),
    experienceYears: z.string(),
    experienceMonths: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.workStatus === "EXPERIENCED" && !d.experienceYears && !d.experienceMonths) {
      ctx.addIssue({
        code: "custom",
        path: ["experienceYears"],
        message: "Add your total work experience.",
      })
    }
  })

export const ExperienceItemSchema = z.object({
  company: z.string().trim().min(1, { error: "Company is required." }),
  title: z.string().trim().min(1, { error: "Job title is required." }),
  startDate: z.string().trim().nullable(),
  endDate: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
})

export const EducationItemSchema = z.object({
  institution: z.string().trim().min(1, { error: "Institution is required." }),
  degree: z.string().trim().nullable(),
  field: z.string().trim().nullable(),
  startDate: z.string().trim().nullable(),
  endDate: z.string().trim().nullable(),
})

export const ProjectItemSchema = z.object({
  name: z.string().trim().min(1, { error: "Project name is required." }),
  description: z.string().trim().nullable(),
  technologies: z.array(z.string()),
})

export const CandidatePreferencesSchema = z.object({
  desiredRoles: z.array(z.string()).min(1, { error: "Add at least one role you're looking for." }),
  preferredLocations: z.array(z.string()).min(1, { error: "Add at least one preferred location." }),
  jobTypes: z.array(z.string()).min(1, { error: "Pick at least one job type." }),
  workModes: z.array(z.string()).min(1, { error: "Pick at least one work mode." }),
  expectedSalary: z
    .string()
    .trim()
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && +v > 0 && +v < 1000), {
      error: "Enter a figure in lakhs per annum, e.g. 12.",
    }),
  noticePeriod: z.string(),
})

export const CandidateOnboardingSchema = z
  .object({
    method: z.enum(["RESUME", "MANUAL"]),
    resumeId: z.string().nullable(),
    basics: CandidateBasicsSchema,
    experience: z.array(ExperienceItemSchema),
    education: z.array(EducationItemSchema).min(1, { error: "Add at least one education entry." }),
    skills: z.array(z.string().trim().min(1)).min(3, { error: "Add at least 3 skills." }),
    projects: z.array(ProjectItemSchema),
    preferences: CandidatePreferencesSchema,
  })
  .superRefine((d, ctx) => {
    if (d.basics.workStatus === "EXPERIENCED" && d.experience.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["experience"],
        message: "Add at least one role from your work history.",
      })
    }
  })

export type CandidateOnboardingInput = z.input<typeof CandidateOnboardingSchema>

/** Flattens a zod error into { "a.b": "message" } (first message per path). */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".")
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
