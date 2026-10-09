import type { ExperienceLevel, EmploymentType, WorkMode } from "@/generated/prisma/enums";

export interface CandidateRecommendationProfile {
  skills?: unknown;
  experience?: unknown;
  preferences?: unknown;
  location?: string | null;
  headline?: string | null;
}

export interface JobRecommendationTarget {
  id: string;
  title: string;
  skills?: unknown;
  nice_to_have_skills?: unknown;
  experience_level: ExperienceLevel;
  employment_type: EmploymentType;
  work_mode?: WorkMode;
  location?: string | null;
  locations?: unknown;
  min_experience?: number | null;
  max_experience?: number | null;
  created_at: Date | string;
}

export interface RecommendationMatchResult {
  score: number; // 0 to 100
  matchingSkills: string[];
  matchedExperience: boolean;
  matchedLocation: boolean;
  matchedEmploymentType: boolean;
}

const EXPERIENCE_HIERARCHY: Record<ExperienceLevel, number> = {
  ENTRY: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
};

function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Sums the durations of experience entries, in years. */
function experienceYearsFromEntries(experience: unknown): number {
  let totalMonths = 0;
  if (Array.isArray(experience)) {
    for (const exp of experience) {
      if (typeof exp !== "object" || exp === null) continue;
      const { startDate, endDate } = exp as { startDate?: string; endDate?: string };
      const start = startDate ? new Date(startDate) : null;
      const end = endDate && !/present|current/i.test(endDate) ? new Date(endDate) : new Date();
      if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        totalMonths += Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
      } else {
        totalMonths += 12;
      }
    }
  }
  return totalMonths / 12;
}

/**
 * Candidate's total experience in years: what they declared during
 * onboarding if available, otherwise estimated from their work history.
 */
export function candidateExperienceYears(candidate: CandidateRecommendationProfile): number {
  const prefs = (candidate.preferences as Record<string, unknown>) || {};
  if (prefs.workStatus === "FRESHER") return 0;
  const total = prefs.totalExperience as { years?: number; months?: number } | null | undefined;
  if (total && typeof total.years === "number") return total.years + (total.months ?? 0) / 12;
  return experienceYearsFromEntries(candidate.experience);
}

/**
 * Infer approximate experience level from candidate experience list and headline.
 */
export function inferCandidateExperienceLevel(
  experience: unknown,
  headline?: string | null,
  years: number = experienceYearsFromEntries(experience)
): ExperienceLevel {
  const headlineLower = (headline || "").toLowerCase();
  if (/\b(lead|staff|principal|director|head|manager)\b/.test(headlineLower) || years >= 8) return "LEAD";
  if (/\b(senior|sr)\b/.test(headlineLower) || years >= 5) return "SENIOR";
  if (years >= 2) return "MID";
  return "ENTRY";
}

const fuzzyIncludes = (a: string, b: string) => {
  const x = normalizeString(a);
  const y = normalizeString(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};

/**
 * Compute recommendation score between a candidate profile and a job opening.
 * Weights:
 * - Skills: up to 50 points (must-haves 45, nice-to-haves 5)
 * - Experience: up to 30 points (years vs. the job's range, else seniority)
 * - Preferences: up to 20 points (location 10, job type 6, work mode 4)
 */
export function calculateJobMatch(
  candidate: CandidateRecommendationProfile,
  job: JobRecommendationTarget
): RecommendationMatchResult {
  /* ---------- Skills ---------- */
  const candidateSkills = strings(candidate.skills);
  const jobSkills = strings(job.skills);
  const niceSkills = strings(job.nice_to_have_skills);

  const has = (skill: string) => candidateSkills.some((cs) => fuzzyIncludes(cs, skill));
  const matchingSkills = jobSkills.filter(has);
  const matchingNice = niceSkills.filter(has);

  let skillsScore: number;
  if (jobSkills.length === 0) {
    skillsScore = 30;
  } else {
    const mustWeight = niceSkills.length ? 45 : 50;
    skillsScore = Math.round((matchingSkills.length / jobSkills.length) * mustWeight);
    if (niceSkills.length) skillsScore += Math.round((matchingNice.length / niceSkills.length) * 5);
    if (matchingSkills.length > 0) skillsScore = Math.max(skillsScore, 15);
  }

  /* ---------- Experience ---------- */
  const years = candidateExperienceYears(candidate);
  let experienceScore: number;
  let matchedExperience = false;

  const hasRange = job.min_experience != null && (job.min_experience > 0 || job.max_experience != null);
  if (hasRange) {
    const min = job.min_experience ?? 0;
    const max = job.max_experience ?? Infinity;
    const gap = years < min ? min - years : years > max ? years - max : 0;
    if (gap === 0) {
      experienceScore = 30;
      matchedExperience = true;
    } else if (gap <= 1) {
      experienceScore = 22;
    } else if (gap <= 2) {
      experienceScore = 14;
    } else {
      experienceScore = 5;
    }
    // Over-qualification hurts less than under-qualification.
    if (gap > 0 && years > max) experienceScore = Math.min(30, experienceScore + 4);
  } else {
    const level = inferCandidateExperienceLevel(candidate.experience, candidate.headline, years);
    const diff = EXPERIENCE_HIERARCHY[level] - EXPERIENCE_HIERARCHY[job.experience_level];
    if (diff === 0) {
      experienceScore = 30;
      matchedExperience = true;
    } else if (diff === 1) {
      experienceScore = 24;
      matchedExperience = true;
    } else if (diff === -1) {
      experienceScore = 18;
    } else {
      experienceScore = Math.abs(diff) === 2 ? 10 : 5;
    }
  }

  /* ---------- Preferences ---------- */
  const prefs = (candidate.preferences as Record<string, unknown>) || {};
  const preferredLocations = [
    ...strings(prefs.preferredLocations),
    ...(typeof prefs.location === "string" ? [prefs.location] : []),
    ...(candidate.location ? [candidate.location] : []),
  ];
  const preferredTypes = [
    ...strings(prefs.jobTypes),
    ...(typeof prefs.employmentType === "string" ? [prefs.employmentType] : []),
  ];
  const preferredModes = strings(prefs.workModes);

  const jobLocations = strings(job.locations);
  const legacyLocation = job.location ?? "";
  const workMode = job.work_mode ?? (/remote/i.test(legacyLocation) ? "REMOTE" : "ONSITE");

  let locationScore = 2;
  let matchedLocation = false;
  if (workMode === "REMOTE" && (!preferredModes.length || preferredModes.includes("REMOTE"))) {
    locationScore = 10;
    matchedLocation = true;
  } else if (
    preferredLocations.some(
      (p) => jobLocations.some((l) => fuzzyIncludes(p, l)) || (legacyLocation && fuzzyIncludes(p, legacyLocation))
    )
  ) {
    locationScore = 10;
    matchedLocation = true;
  } else if (workMode === "REMOTE") {
    locationScore = 7;
    matchedLocation = true;
  } else if (!jobLocations.length && !legacyLocation) {
    locationScore = 7;
    matchedLocation = true;
  }

  const matchedEmploymentType = !preferredTypes.length || preferredTypes.includes(job.employment_type);
  const typeScore = matchedEmploymentType ? 6 : 2;
  const modeScore = !preferredModes.length || preferredModes.includes(workMode) ? 4 : 1;

  const score = Math.min(100, Math.max(0, skillsScore + experienceScore + locationScore + typeScore + modeScore));

  return {
    score,
    matchingSkills,
    matchedExperience,
    matchedLocation,
    matchedEmploymentType,
  };
}
