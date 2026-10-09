/*
 * Search parameters for the candidate job search, shared by the page, the
 * /api/candidate/jobs route and the client so all three read and write the
 * URL the same way. Anything malformed falls back to "no filter".
 */

export const JOB_SEARCH_PAGE_SIZE = 10
export const JOB_SEARCH_MAX_PAGE_SIZE = 50
export const JOB_SEARCH_MAX_QUERY = 100

export const JOB_SORTS = ["match", "newest", "salary"] as const
export type JobSort = (typeof JOB_SORTS)[number]

export const JOB_LIST_KEYS = ["modes", "depts", "types", "levels", "cities", "companies"] as const
export type JobListKey = (typeof JOB_LIST_KEYS)[number]

export type JobFilters = {
  q: string
  modes: string[]
  depts: string[]
  types: string[]
  levels: string[]
  cities: string[]
  companies: string[]
  exp: string
  salary: string
  posted: string
  hideApplied: boolean
  sort: JobSort
}

export const EMPTY_JOB_FILTERS: JobFilters = {
  q: "",
  modes: [],
  depts: [],
  types: [],
  levels: [],
  cities: [],
  companies: [],
  exp: "",
  salary: "",
  posted: "",
  hideApplied: false,
  sort: "match",
}

const ALLOWED: Partial<Record<JobListKey, readonly string[]>> = {
  modes: ["ONSITE", "HYBRID", "REMOTE"],
  types: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
  levels: ["ENTRY", "MID", "SENIOR", "LEAD"],
}

type RawQuery = URLSearchParams | Record<string, string | string[] | undefined>

function reader(query: RawQuery) {
  if (query instanceof URLSearchParams) return (k: string) => query.get(k) ?? ""
  return (k: string) => {
    const v = query[k]
    return (Array.isArray(v) ? v[0] : v) ?? ""
  }
}

const intIn = (v: string, min: number, max: number) =>
  /^\d{1,4}$/.test(v) && +v >= min && +v <= max ? v : ""

export function parseJobFilters(query: RawQuery): JobFilters {
  const one = reader(query)
  const many = (k: JobListKey) => {
    const values = [...new Set(one(k).split(",").map((v) => v.trim()).filter(Boolean))]
      .filter((v) => v.length <= 120)
      .slice(0, 20)
    const allowed = ALLOWED[k]
    return allowed ? values.filter((v) => allowed.includes(v)) : values
  }
  // Older links had a separate location box; fold it into the single search.
  const q = [one("q"), one("loc")].map((s) => s.trim()).filter(Boolean).join(" ")
  const sort = one("sort")

  return {
    q: q.replace(/\s+/g, " ").slice(0, JOB_SEARCH_MAX_QUERY),
    modes: many("modes"),
    depts: many("depts"),
    types: many("types"),
    levels: many("levels"),
    cities: many("cities"),
    companies: many("companies"),
    exp: intIn(one("exp"), 0, 40),
    salary: intIn(one("salary"), 1, 500),
    posted: intIn(one("posted"), 1, 365),
    hideApplied: one("hideApplied") === "1",
    sort: (JOB_SORTS as readonly string[]).includes(sort) ? (sort as JobSort) : "match",
  }
}

export function parseJobPage(query: RawQuery) {
  const one = reader(query)
  const page = Number.parseInt(one("page"), 10)
  const size = Number.parseInt(one("pageSize"), 10)
  return {
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
    pageSize:
      Number.isFinite(size) && size > 0 ? Math.min(size, JOB_SEARCH_MAX_PAGE_SIZE) : JOB_SEARCH_PAGE_SIZE,
  }
}

/** Filters (and optionally the page) as a query string, omitting defaults. */
export function jobFiltersToQuery(f: JobFilters, page = 1) {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set("q", f.q.trim())
  for (const k of JOB_LIST_KEYS) if (f[k].length) p.set(k, f[k].join(","))
  if (f.exp) p.set("exp", f.exp)
  if (f.salary) p.set("salary", f.salary)
  if (f.posted) p.set("posted", f.posted)
  if (f.hideApplied) p.set("hideApplied", "1")
  if (f.sort !== "match") p.set("sort", f.sort)
  if (page > 1) p.set("page", String(page))
  return p.toString()
}

/* ------------------------------------------------------------------ */
/* Response shape                                                      */
/* ------------------------------------------------------------------ */

export type JobItem = {
  id: string
  title: string
  company: string | null
  companyVerified: boolean
  department: string | null
  location: string | null
  locations: string[]
  work_mode: string
  employment_type: string
  experience_level: string
  min_experience: number
  max_experience: number | null
  salary_min: number | null
  salary_max: number | null
  salary_disclosed: boolean
  openings: number
  skills: string[]
  resume_required: boolean
  created_at: string
  application_deadline: string | null
  matchScore: number
  matchingSkills: string[]
}

/** Per-filter option counts; each respects every *other* active filter. */
export type JobFacets = {
  modes: Record<string, number>
  types: Record<string, number>
  levels: Record<string, number>
  depts: Record<string, number>
  cities: Record<string, number>
  companies: Record<string, number>
  salary: Record<string, number>
  posted: Record<string, number>
}

export type JobSearchResult = {
  jobs: JobItem[]
  total: number
  /** Open jobs before any filter, for "12 of 340". */
  totalOpen: number
  page: number
  pageSize: number
  pageCount: number
  facets?: JobFacets
}
