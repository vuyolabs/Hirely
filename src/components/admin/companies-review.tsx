"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  ExternalLink,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { companyTypeInfo } from "@/lib/india";
import { setCompanyVerification } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { TextInput } from "@/components/onboarding/fields";

export type CompanyItem = {
  id: string;
  legal_name: string;
  display_name: string;
  company_type: string;
  industry: string;
  company_size: string;
  website: string | null;
  gstin: string;
  pan: string;
  registration_number: string | null;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  verification_note: string | null;
  created_at: Date | string;
  recruiters: {
    first_name: string;
    last_name: string;
    job_title: string | null;
    phone: string | null;
    linkedin_url: string | null;
    user: { email: string };
  }[];
};

const FILTERS = ["PENDING", "VERIFIED", "REJECTED", "ALL"] as const;

export function CompaniesReview({ companies }: { companies: CompanyItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("PENDING");
  const visible = companies.filter(
    (c) => filter === "ALL" || c.verification_status === filter,
  );

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-full border border-border bg-muted/50 p-1">
        {FILTERS.map((f) => {
          const count =
            f === "ALL"
              ? companies.length
              : companies.filter((c) => c.verification_status === f).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nothing here"
          description={
            filter === "PENDING"
              ? "No companies are waiting for verification."
              : "No companies match this filter."
          }
        />
      ) : (
        visible.map((c) => <CompanyCard key={c.id} company={c} />)
      )}
    </div>
  );
}

function CompanyCard({ company: c }: { company: CompanyItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const type = companyTypeInfo(c.company_type);

  const update = (status: "VERIFIED" | "REJECTED" | "PENDING", reason?: string) =>
    start(async () => {
      setError(null);
      const res = await setCompanyVerification(c.id, status, reason);
      if (res.error) setError(res.error);
      else {
        setRejecting(false);
        router.refresh();
      }
    });

  return (
    <article className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{c.display_name}</h2>
            <StatusBadge status={c.verification_status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {c.legal_name} · {type?.label ?? c.company_type} · {c.industry} · {c.company_size} employees
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Submitted {formatDate(c.created_at)}</p>
      </header>

      <div className="grid gap-6 px-5 py-4 md:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <Row label="GSTIN" mono>
            {c.gstin}
          </Row>
          <Row label="PAN" mono>
            {c.pan}
          </Row>
          {c.registration_number && (
            <Row label={type?.registration ?? "Reg. no."} mono>
              {c.registration_number}
            </Row>
          )}
          <Row label="Address">
            {c.address_line}, {c.city}, {c.state} {c.pincode}
          </Row>
          {c.website && (
            <Row label="Website">
              <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                {c.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Row>
          )}
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recruiters ({c.recruiters.length})
          </p>
          <ul className="mt-2 space-y-2">
            {c.recruiters.map((r) => (
              <li key={r.user.email} className="text-sm">
                <span className="font-medium">
                  {r.first_name} {r.last_name}
                </span>
                {r.job_title && <span className="text-muted-foreground"> · {r.job_title}</span>}
                <span className="block text-xs text-muted-foreground">
                  {r.user.email}
                  {r.phone && ` · +91 ${r.phone}`}
                  {r.linkedin_url && (
                    <>
                      {" · "}
                      <a href={r.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        LinkedIn
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {c.verification_status === "REJECTED" && c.verification_note && (
        <p className="mx-5 mb-4 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Rejected: {c.verification_note}
        </p>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        {rejecting ? (
          <>
            <TextInput
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason, e.g. GSTIN is cancelled on the GST portal"
              className="h-9 max-w-md flex-1"
            />
            <Button size="sm" variant="destructive" disabled={pending} onClick={() => update("REJECTED", note)}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm rejection
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </>
        ) : c.verification_status === "PENDING" ? (
          <>
            <Button size="sm" disabled={pending} onClick={() => update("VERIFIED")} className="gap-1.5">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setRejecting(true)} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => update("PENDING")} className="gap-1.5">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Move back to review
          </Button>
        )}
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </footer>
    </article>
  );
}

function Row({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words", mono && "font-mono tracking-wide")}>{children}</dd>
    </div>
  );
}
