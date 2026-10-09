"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  POSTED_FILTERS,
  SALARY_FILTERS,
  WORK_MODES,
  employmentTypeLabel,
  experienceLevelLabel,
  formatExperience,
  formatSalary,
  workModeLabel,
} from "@/lib/jobs";
import {
  EMPTY_JOB_FILTERS,
  JOB_SEARCH_MAX_QUERY,
  JOB_SEARCH_PAGE_SIZE,
  jobFiltersToQuery,
  type JobFacets,
  type JobFilters,
  type JobItem,
  type JobListKey,
  type JobSearchResult,
} from "@/lib/job-search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { applyToJob, toggleSaveJob } from "@/actions/candidate";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState, timeAgo } from "@/components/dashboard/primitives";
import { Select } from "@/components/onboarding/fields";

export type { JobItem } from "@/lib/job-search";

type Filters = JobFilters;
type ListKey = JobListKey;

const SEARCH_DEBOUNCE_MS = 350;
const NO_FACETS: JobFacets = {
  modes: {},
  types: {},
  levels: {},
  depts: {},
  cities: {},
  companies: {},
  salary: {},
  posted: {},
};

/** A filter query string with the page added, same shape as jobFiltersToQuery(f, page). */
function pageQuery(filterKey: string, page: number) {
  const p = new URLSearchParams(filterKey);
  if (page > 1) p.set("page", String(page));
  return p.toString();
}

/* ------------------------------------------------------------------ */

export type JobsViewProps = {
  initialFilters: Filters;
  initialResult: JobSearchResult;
  appliedJobIds: string[];
  savedJobIds: string[];
  candidateResumes: { id: string; file_name: string }[];
  myPreferences: {
    experienceYears: number;
    locations: string[];
    workModes: string[];
    jobTypes: string[];
  };
};

export function JobsView({
  initialFilters,
  initialResult,
  appliedJobIds,
  savedJobIds,
  candidateResumes,
  myPreferences,
}: JobsViewProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* ---------- server search ---------- */
  // Typing is debounced; every other filter applies immediately.
  const debouncedQ = useDebouncedValue(filters.q.trim(), SEARCH_DEBOUNCE_MS);
  const filterKey = jobFiltersToQuery({ ...filters, q: debouncedQ });

  // The page belongs to one set of filters: change a filter and you're back on page 1.
  const [pageState, setPageState] = useState({ key: filterKey, page: initialResult.page });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const requestKey = pageQuery(filterKey, page);

  const [result, setResult] = useState<JobSearchResult>(initialResult);
  const [facets, setFacets] = useState<JobFacets>(initialResult.facets ?? NO_FACETS);
  const [loaded, setLoaded] = useState({ requestKey, filterKey });
  const [searchError, setSearchError] = useState<{ key: string; message: string } | null>(null);
  const [retries, setRetries] = useState(0);

  const loading = requestKey !== loaded.requestKey && searchError?.key !== requestKey;
  const typing = filters.q.trim() !== debouncedQ;
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestKey === loaded.requestKey) return;

    // Only the page changed: the facet counts are still valid, skip them.
    const withFacets = filterKey !== loaded.filterKey;
    const params = new URLSearchParams(requestKey);
    params.set("pageSize", String(JOB_SEARCH_PAGE_SIZE));
    if (!withFacets) params.set("facets", "0");

    const controller = new AbortController();
    fetch(`/api/candidate/jobs?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error(data?.error || "Search failed. Please try again.");

        const next = data as JobSearchResult;
        setResult(next);
        if (next.facets) setFacets(next.facets);
        // The server clamps out-of-range pages (e.g. after results shrank).
        setPageState({ key: filterKey, page: next.page });
        setLoaded({ requestKey: pageQuery(filterKey, next.page), filterKey });
        setSearchError(null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSearchError({
          key: requestKey,
          message: error instanceof Error ? error.message : "Search failed. Please try again.",
        });
      });

    // A newer request supersedes this one.
    return () => controller.abort();
  }, [requestKey, filterKey, loaded, retries, router]);

  // Keep the URL shareable without triggering navigations.
  useEffect(() => {
    window.history.replaceState(null, "", requestKey ? `?${requestKey}` : window.location.pathname);
  }, [requestKey]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggle = (key: ListKey, value: string) =>
    update({
      [key]: filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    });

  const goToPage = (next: number) => {
    setPageState({ key: filterKey, page: next });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const retry = () => {
    setSearchError(null);
    setRetries((n) => n + 1);
  };

  /* ---------- per-viewer state ---------- */
  const [appliedIds, setAppliedIds] = useState<string[]>(appliedJobIds);
  const [savedIds, setSavedIds] = useState<string[]>(savedJobIds);
  const [applyJob, setApplyJob] = useState<JobItem | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const applied = useMemo(() => new Set(appliedIds), [appliedIds]);

  const sorted = (counts: Record<string, number>, selected: string[]) =>
    [...new Set([...Object.keys(counts), ...selected])]
      .map((v) => ({ value: v, label: v, count: counts[v] ?? 0 }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  /* ---------- active chips ---------- */
  const chips: { label: string; clear: () => void }[] = [
    ...(filters.q.trim() ? [{ label: `“${filters.q.trim()}”`, clear: () => update({ q: "" }) }] : []),
    ...filters.modes.map((v) => ({ label: workModeLabel(v), clear: () => toggle("modes", v) })),
    ...filters.types.map((v) => ({ label: employmentTypeLabel(v), clear: () => toggle("types", v) })),
    ...filters.levels.map((v) => ({ label: experienceLevelLabel(v), clear: () => toggle("levels", v) })),
    ...filters.depts.map((v) => ({ label: v, clear: () => toggle("depts", v) })),
    ...filters.cities.map((v) => ({ label: v, clear: () => toggle("cities", v) })),
    ...filters.companies.map((v) => ({ label: v, clear: () => toggle("companies", v) })),
    ...(filters.exp !== ""
      ? [{ label: `${filters.exp} yrs experience`, clear: () => update({ exp: "" }) }]
      : []),
    ...(filters.salary ? [{ label: `₹${filters.salary}+ LPA`, clear: () => update({ salary: "" }) }] : []),
    ...(filters.posted
      ? [
          {
            label: POSTED_FILTERS.find((p) => String(p.value) === filters.posted)?.label ?? "",
            clear: () => update({ posted: "" }),
          },
        ]
      : []),
    ...(filters.hideApplied ? [{ label: "Hiding applied", clear: () => update({ hideApplied: false }) }] : []),
  ];

  const clearAll = () => setFilters({ ...EMPTY_JOB_FILTERS, sort: filters.sort });

  const usePreferences = () =>
    setFilters({
      ...EMPTY_JOB_FILTERS,
      sort: "match",
      exp: String(myPreferences.experienceYears),
      modes: myPreferences.workModes,
      types: myPreferences.jobTypes,
      cities: myPreferences.locations.filter((c) => c in facets.cities),
    });

  /* ---------- actions ---------- */
  const selectedResumeId = candidateResumes[0]?.id || "";

  const handleApply = () => {
    if (!applyJob) return;
    setMessage(null);
    startTransition(async () => {
      const res = await applyToJob(applyJob.id, selectedResumeId || null, coverLetter);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setAppliedIds((prev) => [...prev, applyJob.id]);
        setMessage({ type: "success", text: "Application submitted successfully!" });
        setTimeout(() => {
          setApplyJob(null);
          setCoverLetter("");
          setMessage(null);
        }, 1500);
      }
    });
  };

  const handleToggleSave = (jobId: string) => {
    setSavedIds((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]));
    startTransition(async () => {
      await toggleSaveJob(jobId);
    });
  };

  const { jobs: visible, total, totalOpen, pageCount } = result;

  const panel = (
    <FilterPanel
      filters={filters}
      update={update}
      toggle={toggle}
      facets={facets}
      sorted={sorted}
      appliedCount={appliedIds.length}
    />
  );

  return (
    <div className="space-y-5">
      {/* ---------- Search bar ---------- */}
      <div className="rounded-2xl border border-border bg-card p-2 shadow-xs">
        <label className="flex items-center gap-2.5 rounded-xl px-3 focus-within:bg-muted/50">
          {loading || typing ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <input
            type="search"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            maxLength={JOB_SEARCH_MAX_QUERY}
            placeholder="Search by job title, skill, company or city"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            aria-label="Search jobs"
          />
          {filters.q && (
            <button type="button" onClick={() => update({ q: "" })} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* ---------- Sidebar ---------- */}
        <aside className="hidden rounded-2xl border border-border bg-card lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </p>
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>
          {panel}
        </aside>

        {/* ---------- Results ---------- */}
        <div ref={resultsRef} className="min-w-0 scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" aria-live="polite">
              <span className="font-semibold">{total}</span>{" "}
              <span className="text-muted-foreground">
                {total === 1 ? "job" : "jobs"}
                {total !== totalOpen && ` of ${totalOpen}`}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="gap-1.5 lg:hidden">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {chips.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{chips.length}</span>
                )}
              </Button>
              <div className="w-44">
                <Select
                  aria-label="Sort jobs"
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
                  options={[
                    { value: "match", label: "Sort: Best match" },
                    { value: "newest", label: "Sort: Newest" },
                    { value: "salary", label: "Sort: Highest salary" },
                  ]}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 py-1 pr-2 pl-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {c.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="px-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                Clear all
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={usePreferences}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Apply my job preferences
            </button>
          )}

          {searchError?.key === requestKey && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {searchError.message}
              <Button size="sm" variant="outline" onClick={retry}>
                Retry
              </Button>
            </div>
          )}

          <div aria-busy={loading} className={cn("transition-opacity", loading && "pointer-events-none opacity-60")}>
            {visible.length === 0 ? (
              <EmptyState
                icon={BriefcaseBusiness}
                title={totalOpen ? "No jobs match these filters" : "No open roles yet"}
                description={
                  totalOpen
                    ? "Try removing a filter or broadening your search."
                    : "New roles are posted regularly — check back soon."
                }
                action={
                  chips.length ? (
                    <Button size="sm" variant="outline" onClick={clearAll}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="space-y-3">
                {visible.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    applied={applied.has(job.id)}
                    saved={savedIds.includes(job.id)}
                    onSave={() => handleToggleSave(job.id)}
                    onApply={() => setApplyJob(job)}
                  />
                ))}
              </ul>
            )}
          </div>

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {Math.min(page, pageCount)} of {pageCount}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pageCount || loading} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </nav>
          )}
        </div>
      </div>

      {/* ---------- Mobile filters ---------- */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[88vw] gap-0 overflow-y-auto p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </SheetTitle>
          </SheetHeader>
          {panel}
          <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-popover p-3">
            <Button variant="outline" className="flex-1" onClick={clearAll}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Show ${total} jobs`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---------- Apply dialog ---------- */}
      {applyJob && (
        <Dialog open={!!applyJob} onOpenChange={(open) => !open && setApplyJob(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply for {applyJob.title}</DialogTitle>
              <DialogDescription>
                Submit your application to {applyJob.company || "the hiring team"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Resume</Label>
                {candidateResumes.length > 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{candidateResumes[0].file_name}</p>
                      <p className="text-xs text-muted-foreground">Linked to your profile</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
                    {applyJob.resume_required
                      ? "This role requires a resume. Upload one from your profile first."
                      : "No resume on file — you can still apply with your profile."}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coverLetter">Note to the recruiter (optional)</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Why are you a strong fit for this role?"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="min-h-28"
                  disabled={isPending}
                />
              </div>

              {message && (
                <div
                  className={cn(
                    "rounded-lg p-3 text-xs",
                    message.type === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {message.text}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setApplyJob(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={isPending || (applyJob.resume_required && candidateResumes.length === 0)}
                className="gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isPending ? "Submitting…" : "Submit application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter panel                                                        */
/* ------------------------------------------------------------------ */

type Option = { value: string; label: string; count: number };

function FilterPanel({
  filters,
  update,
  toggle,
  facets,
  sorted,
  appliedCount,
}: {
  filters: Filters;
  update: (p: Partial<Filters>) => void;
  toggle: (key: ListKey, value: string) => void;
  facets: JobFacets;
  sorted: (counts: Record<string, number>, selected: string[]) => Option[];
  appliedCount: number;
}) {
  const fixed = (list: readonly { value: string; label: string }[], counts: Record<string, number>) =>
    list.map((o) => ({ ...o, count: counts[o.value] ?? 0 }));

  return (
    <div className="divide-y divide-border">
      <FilterGroup title="Work mode">
        <CheckList options={fixed(WORK_MODES, facets.modes)} selected={filters.modes} onToggle={(v) => toggle("modes", v)} />
      </FilterGroup>

      <FilterGroup title="Experience">
        <Select
          aria-label="Your experience"
          value={filters.exp}
          onChange={(e) => update({ exp: e.target.value })}
          options={[
            { value: "", label: "Any experience" },
            ...Array.from({ length: 31 }, (_, i) => ({
              value: String(i),
              label: i === 0 ? "Fresher (0 yrs)" : `${i} ${i === 1 ? "year" : "years"}`,
            })),
          ]}
          className="h-9"
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">Shows roles whose range includes this.</p>
      </FilterGroup>

      <FilterGroup title="Salary">
        <RadioList
          name="salary"
          value={filters.salary}
          onChange={(v) => update({ salary: v })}
          options={SALARY_FILTERS.map((s) => ({
            value: String(s.value),
            label: s.label,
            count: facets.salary[String(s.value)] ?? 0,
          }))}
        />
      </FilterGroup>

      <FilterGroup title="Department" defaultOpen={filters.depts.length > 0}>
        <CheckList options={sorted(facets.depts, filters.depts)} selected={filters.depts} onToggle={(v) => toggle("depts", v)} limit={6} />
      </FilterGroup>

      <FilterGroup title="Location">
        <CheckList options={sorted(facets.cities, filters.cities)} selected={filters.cities} onToggle={(v) => toggle("cities", v)} limit={6} />
      </FilterGroup>

      <FilterGroup title="Job type">
        <CheckList options={fixed(EMPLOYMENT_TYPES, facets.types)} selected={filters.types} onToggle={(v) => toggle("types", v)} />
      </FilterGroup>

      <FilterGroup title="Seniority" defaultOpen={filters.levels.length > 0}>
        <CheckList options={fixed(EXPERIENCE_LEVELS, facets.levels)} selected={filters.levels} onToggle={(v) => toggle("levels", v)} />
      </FilterGroup>

      <FilterGroup title="Freshness">
        <RadioList
          name="posted"
          value={filters.posted}
          onChange={(v) => update({ posted: v })}
          options={POSTED_FILTERS.map((p) => ({
            value: String(p.value),
            label: p.label,
            count: facets.posted[String(p.value)] ?? 0,
          }))}
        />
      </FilterGroup>

      <FilterGroup title="Company" defaultOpen={filters.companies.length > 0}>
        <CheckList options={sorted(facets.companies, filters.companies)} selected={filters.companies} onToggle={(v) => toggle("companies", v)} limit={6} />
      </FilterGroup>

      {appliedCount > 0 && (
        <div className="px-4 py-3">
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
            Hide jobs I&apos;ve applied to
            <input
              type="checkbox"
              checked={filters.hideApplied}
              onChange={(e) => update({ hideApplied: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {title}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </section>
  );
}

function CheckList({
  options,
  selected,
  onToggle,
  limit,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!options.length) return <p className="text-xs text-muted-foreground">Nothing to filter yet.</p>;
  const shown = limit && !expanded ? options.slice(0, limit) : options;

  return (
    <div className="space-y-0.5">
      {shown.map((o) => {
        const on = selected.includes(o.value);
        const disabled = !on && o.count === 0;
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onToggle(o.value)}
            className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-input",
              )}
            >
              {on && <Check className="h-3 w-3" />}
            </span>
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{o.count}</span>
          </button>
        );
      })}
      {limit && options.length > limit && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="px-1.5 pt-1 text-xs font-semibold text-primary hover:underline">
          {expanded ? "Show less" : `Show ${options.length - limit} more`}
        </button>
      )}
    </div>
  );
}

function RadioList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-0.5" role="radiogroup" aria-label={name}>
      {[{ value: "", label: "Any", count: -1 }, ...options].map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value || "any"}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", on ? "border-primary" : "border-input")}>
              {on && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="flex-1">{o.label}</span>
            {o.count >= 0 && <span className="text-xs tabular-nums text-muted-foreground">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Job card                                                            */
/* ------------------------------------------------------------------ */

function JobCard({
  job,
  applied,
  saved,
  onSave,
  onApply,
}: {
  job: JobItem;
  applied: boolean;
  saved: boolean;
  onSave: () => void;
  onApply: () => void;
}) {
  const salary = formatSalary(job);
  const matched = new Set(job.matchingSkills);

  return (
    <li className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-md hover:shadow-black/[0.03]">
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {(job.company || "C")[0]}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/candidate/jobs/${job.id}`} className="font-semibold after:absolute after:inset-0 hover:text-primary">
                {job.title}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {job.company || "Confidential company"}
                  {job.companyVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Verified company" />}
                </span>
                {job.department && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{job.department}</span>
                  </>
                )}
              </p>
            </div>
            <MatchBadge score={job.matchScore} />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {formatExperience(job)}
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {salary ?? "Not disclosed"}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location || workModeLabel(job.work_mode)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(job.created_at)}
            </span>
          </div>

          {job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 7).map((s) => (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                    matched.has(s) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {matched.has(s) && <Check className="h-3 w-3" />}
                  {s}
                </span>
              ))}
              {job.skills.length > 7 && (
                <span className="px-1 text-[11px] text-muted-foreground">+{job.skills.length - 7} more</span>
              )}
            </div>
          )}

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-0.5">{employmentTypeLabel(job.employment_type)}</span>
              <span className="rounded-full border border-border px-2 py-0.5">{workModeLabel(job.work_mode)}</span>
              {job.openings > 1 && <span className="rounded-full border border-border px-2 py-0.5">{job.openings} openings</span>}
              {job.application_deadline && (
                <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                  Apply by {new Date(job.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={onSave} aria-label={saved ? "Unsave job" : "Save job"}>
                {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              <Link href={`/candidate/jobs/${job.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}>
                Details
              </Link>
              {applied ? (
                <span className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Applied
                </span>
              ) : (
                <Button size="sm" onClick={onApply} className="rounded-full px-4">
                  Apply
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function MatchBadge({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
      : score >= 50
        ? "bg-primary/10 text-primary ring-primary/20"
        : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      title="How well this role matches your skills, experience and preferences"
      className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ring-inset", tone)}
    >
      {score}% match
    </span>
  );
}
