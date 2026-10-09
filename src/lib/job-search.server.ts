import "server-only"

import { Prisma } from "@/generated/prisma/client"
import type { EmploymentType, ExperienceLevel, WorkMode } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { POSTED_FILTERS, SALARY_FILTERS, asStringArray } from "@/lib/jobs"
import { calculateJobMatch, type CandidateRecommendationProfile } from "@/lib/recommendations"
import type { JobFacets, JobFilters, JobItem, JobListKey, JobSearchResult } from "@/lib/job-search"

/*
 * Candidate job search. Filtering, facet counts, sorting and pagination all
 * run in Postgres; only "best match" ordering needs the scoring function, so
 * that path scores a slim projection of every matching row and then loads
 * the full rows for just the requested page.
 */

export type JobSearchViewer = {
  candidateId: string
  profile: CandidateRecommendationProfile
}

type ConditionKey = "q" | JobListKey | "exp" | "salary" | "posted" | "hideApplied"

const FROM = Prisma.sql`FROM "Job" j JOIN "RecruiterProfile" r ON r.id = j."recruiterId"`

/** Open = published and not past its deadline. */
const OPEN = Prisma.sql`j.status = 'PUBLISHED' AND (j.application_deadline IS NULL OR j.application_deadline >= date_trunc('day', now() AT TIME ZONE 'UTC'))`

/** Salary used for filtering and sorting; undisclosed salaries count as unknown. */
const SALARY = Prisma.sql`(CASE WHEN j.salary_disclosed THEN COALESCE(j.salary_max, j.salary_min) END)`

const CITIES = Prisma.sql`jsonb_array_elements_text(CASE WHEN jsonb_typeof(j.locations) = 'array' THEN j.locations ELSE '[]'::jsonb END)`

/** Everything a single search box should find: role, company, department, skills and place. */
const HAYSTACK = Prisma.sql`concat_ws(' ', j.title, r.company_name, j.department, j.location, j.skills::text, j.locations::text)`

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&")
const inList = (values: string[]) => Prisma.join(values.map((v) => Prisma.sql`${v}::text`))

function buildConditions(f: JobFilters, candidateId: string): Record<ConditionKey, Prisma.Sql | null> {
  const tokens = [...new Set(f.q.toLowerCase().split(" ").filter(Boolean))].slice(0, 8)

  return {
    // Every word must appear somewhere, so "react bengaluru" narrows instead of widening.
    q: tokens.length
      ? Prisma.join(
          tokens.map((t) => Prisma.sql`${HAYSTACK} ILIKE ${`%${escapeLike(t)}%`}::text`),
          " AND ",
        )
      : null,
    modes: f.modes.length ? Prisma.sql`j.work_mode::text IN (${inList(f.modes)})` : null,
    types: f.types.length ? Prisma.sql`j.employment_type::text IN (${inList(f.types)})` : null,
    levels: f.levels.length ? Prisma.sql`j.experience_level::text IN (${inList(f.levels)})` : null,
    depts: f.depts.length ? Prisma.sql`j.department IN (${inList(f.depts)})` : null,
    companies: f.companies.length ? Prisma.sql`r.company_name IN (${inList(f.companies)})` : null,
    cities: f.cities.length
      ? Prisma.sql`EXISTS (SELECT 1 FROM ${CITIES} AS city(v) WHERE city.v IN (${inList(f.cities)}))`
      : null,
    exp: f.exp
      ? Prisma.sql`j.min_experience <= ${Number(f.exp)}::int AND (j.max_experience IS NULL OR j.max_experience >= ${Number(f.exp)}::int)`
      : null,
    salary: f.salary ? Prisma.sql`${SALARY} >= ${Number(f.salary)}::float8` : null,
    posted: f.posted
      ? Prisma.sql`j.created_at >= (now() AT TIME ZONE 'UTC') - make_interval(days => ${Number(f.posted)}::int)`
      : null,
    hideApplied: f.hideApplied
      ? Prisma.sql`NOT EXISTS (SELECT 1 FROM "Application" a WHERE a."jobId" = j.id AND a."candidateId" = ${candidateId}::text)`
      : null,
  }
}

type Conditions = Record<ConditionKey, Prisma.Sql | null>

const activeKeys = (conditions: Conditions) =>
  (Object.keys(conditions) as ConditionKey[]).filter((k) => conditions[k])

const flag = (k: ConditionKey) => Prisma.raw(`m."c_${k}"`)

/**
 * Every open job, with one boolean column per active filter. Facet counts
 * need "all filters except my own", so evaluating each filter once here
 * lets a single statement compute every count.
 */
function matchesCte(conditions: Conditions) {
  const flags = activeKeys(conditions).map(
    (k) => Prisma.sql`, (${conditions[k]!}) AS ${Prisma.raw(`"c_${k}"`)}`,
  )
  return Prisma.sql`WITH m AS (
    SELECT j.id, j.created_at, j.work_mode::text AS mode, j.employment_type::text AS type,
           j.experience_level::text AS level, j.department AS dept, r.company_name AS company,
           j.locations, ${SALARY} AS sal ${flags.length ? Prisma.join(flags, "") : Prisma.empty}
    ${FROM} WHERE ${OPEN}
  )`
}

/** Rows of `m` passing every active filter, optionally leaving one out. */
function matchedExcept(conditions: Conditions, skip?: ConditionKey) {
  const parts = activeKeys(conditions).filter((k) => k !== skip).map(flag)
  return parts.length ? Prisma.join(parts, " AND ") : Prisma.sql`TRUE`
}

const valuesList = (values: readonly number[]) =>
  Prisma.raw(values.map((v) => `(${Number(v)})`).join(", "))

/** Total, total open and (optionally) every facet, in one round trip. */
async function loadStats(conditions: Conditions, withFacets: boolean) {
  const all = matchedExcept(conditions)
  const except = (k: ConditionKey) => matchedExcept(conditions, k)
  const group = (name: string, column: string, k: ConditionKey) =>
    Prisma.sql`UNION ALL SELECT ${name}::text, ${Prisma.raw(column)}, count(*)::int FROM m WHERE ${except(k)} GROUP BY 2`

  const facetSql = withFacets
    ? Prisma.sql`
      ${group("modes", "mode", "modes")}
      ${group("types", "type", "types")}
      ${group("levels", "level", "levels")}
      ${group("depts", "dept", "depts")}
      ${group("companies", "company", "companies")}
      UNION ALL SELECT 'cities', city.v, count(DISTINCT m.id)::int FROM m
        CROSS JOIN LATERAL jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(m.locations) = 'array' THEN m.locations ELSE '[]'::jsonb END) AS city(v)
        WHERE ${except("cities")} GROUP BY 2
      UNION ALL SELECT 'salary', b.v::text, count(m.id)::int
        FROM (VALUES ${valuesList(SALARY_FILTERS.map((s) => s.value))}) AS b(v)
        LEFT JOIN m ON m.sal >= b.v AND ${except("salary")} GROUP BY 2
      UNION ALL SELECT 'posted', b.v::text, count(m.id)::int
        FROM (VALUES ${valuesList(POSTED_FILTERS.map((p) => p.value))}) AS b(v)
        LEFT JOIN m ON m.created_at >= (now() AT TIME ZONE 'UTC') - make_interval(days => b.v)
          AND ${except("posted")} GROUP BY 2`
    : Prisma.empty

  const rows = await prisma.$queryRaw<{ f: string; v: string | null; n: number }[]>`
    ${matchesCte(conditions)}
    SELECT 'total'::text AS f, NULL::text AS v, (count(*) FILTER (WHERE ${all}))::int AS n FROM m
    UNION ALL SELECT 'open', NULL, count(*)::int FROM m
    ${facetSql}`

  const facets: JobFacets = {
    modes: {},
    types: {},
    levels: {},
    depts: {},
    companies: {},
    cities: {},
    salary: {},
    posted: {},
  }
  let total = 0
  let totalOpen = 0
  for (const { f, v, n } of rows) {
    if (f === "total") total = n
    else if (f === "open") totalOpen = n
    else if (v && f in facets) facets[f as keyof JobFacets][v] = n
  }
  return { total, totalOpen, facets: withFacets ? facets : undefined }
}

type ScoreRow = {
  id: string
  title: string
  skills: unknown
  nice_to_have_skills: unknown
  experience_level: ExperienceLevel
  employment_type: EmploymentType
  work_mode: WorkMode
  location: string | null
  locations: unknown
  min_experience: number
  max_experience: number | null
  created_at: Date
}

const JOB_SELECT = {
  id: true,
  title: true,
  department: true,
  location: true,
  locations: true,
  work_mode: true,
  employment_type: true,
  experience_level: true,
  min_experience: true,
  max_experience: true,
  salary_min: true,
  salary_max: true,
  salary_disclosed: true,
  openings: true,
  skills: true,
  nice_to_have_skills: true,
  resume_required: true,
  created_at: true,
  application_deadline: true,
  recruiter: {
    select: { company_name: true, company: { select: { verification_status: true } } },
  },
} as const

export async function searchJobs(
  viewer: JobSearchViewer,
  filters: JobFilters,
  { page, pageSize }: { page: number; pageSize: number },
  { withFacets = true }: { withFacets?: boolean } = {},
): Promise<JobSearchResult> {
  const conditions = buildConditions(filters, viewer.candidateId)

  // Queries run one after another: the database sits behind a pooler with a
  // small connection cap, and each search should hold a single connection.
  const { total, totalOpen, facets } = await loadStats(conditions, withFacets)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize

  let ids: string[] = []
  if (total > 0 && filters.sort === "match") {
    // Match scores come from application code, so score the slim projection
    // of every matching row, then load full rows for this page only.
    const rows = await prisma.$queryRaw<ScoreRow[]>`
      SELECT j.id, j.title, j.skills, j.nice_to_have_skills, j.experience_level::text AS experience_level,
             j.employment_type::text AS employment_type, j.work_mode::text AS work_mode, j.location,
             j.locations, j.min_experience, j.max_experience, j.created_at
      ${FROM} WHERE ${Prisma.join([OPEN, ...activeKeys(conditions).map((k) => Prisma.sql`(${conditions[k]!})`)], " AND ")}`
    ids = rows
      .map((row) => ({ id: row.id, at: row.created_at.getTime(), score: calculateJobMatch(viewer.profile, row).score }))
      .sort((a, b) => b.score - a.score || b.at - a.at || b.id.localeCompare(a.id))
      .slice(offset, offset + pageSize)
      .map((r) => r.id)
  } else if (total > 0) {
    const order =
      filters.sort === "salary"
        ? Prisma.sql`ORDER BY m.sal DESC NULLS LAST, m.created_at DESC, m.id DESC`
        : Prisma.sql`ORDER BY m.created_at DESC, m.id DESC`
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      ${matchesCte(conditions)}
      SELECT m.id FROM m WHERE ${matchedExcept(conditions)} ${order}
      LIMIT ${pageSize}::int OFFSET ${offset}::int`
    ids = rows.map((r) => r.id)
  }
  const found = { ids, total, page: current, pageCount }

  const records = found.ids.length
    ? await prisma.job.findMany({ where: { id: { in: found.ids } }, select: JOB_SELECT })
    : []
  const byId = new Map(records.map((r) => [r.id, r]))

  const jobs: JobItem[] = found.ids.flatMap((id) => {
    const job = byId.get(id)
    if (!job) return [] // Deleted between the two queries.
    const match = calculateJobMatch(viewer.profile, job)
    return [
      {
        id: job.id,
        title: job.title,
        company: job.recruiter.company_name,
        companyVerified: job.recruiter.company?.verification_status === "VERIFIED",
        department: job.department,
        location: job.location,
        locations: asStringArray(job.locations),
        work_mode: job.work_mode,
        employment_type: job.employment_type,
        experience_level: job.experience_level,
        min_experience: job.min_experience,
        max_experience: job.max_experience,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_disclosed: job.salary_disclosed,
        openings: job.openings,
        skills: asStringArray(job.skills),
        resume_required: job.resume_required,
        created_at: job.created_at.toISOString(),
        application_deadline: job.application_deadline?.toISOString() ?? null,
        matchScore: match.score,
        matchingSkills: match.matchingSkills,
      },
    ]
  })

  return {
    jobs,
    total: found.total,
    totalOpen,
    page: found.page,
    pageSize,
    pageCount: found.pageCount,
    ...(facets && { facets }),
  }
}
