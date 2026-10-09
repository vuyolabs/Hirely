"use client";

import { formatDate, formatDateTime } from "@/lib/format";
import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ApplicationWithJob } from "@/lib/types/candidate";

type CandidateApplicationsViewProps = {
  applications: (ApplicationWithJob & {
    job: {
      title: string;
      location?: string | null;
      recruiter: {
        company_name: string | null;
      };
    };
    statusHistory?: {
      id: string;
      from_status: string | null;
      to_status: string;
      created_at: Date | string;
    }[];
    resume?: {
      file_name: string;
    } | null;
  })[];
};

export function CandidateApplicationsView({ applications }: CandidateApplicationsViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return <Badge variant="secondary">Applied</Badge>;
      case "SCREENING":
        return (
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-600 dark:text-amber-400"
          >
            Screening
          </Badge>
        );
      case "SHORTLISTED":
        return (
          <Badge variant="default" className="bg-blue-600">
            Shortlisted
          </Badge>
        );
      case "INTERVIEW":
        return (
          <Badge variant="default" className="bg-purple-600">
            Interview
          </Badge>
        );
      case "HIRED":
        return (
          <Badge variant="default" className="bg-emerald-600">
            Hired
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the status and timeline of all your job submissions.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold">No applications yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            You haven&apos;t applied to any positions yet. Explore open roles and
            submit your profile.
          </p>
          <div className="mt-5">
            <Link href="/candidate/jobs" className={buttonVariants()}>
              Browse Open Jobs
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">{app.job.title}</h3>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {app.job.recruiter.company_name || "Company"}
                      </span>

                      {app.job.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {app.job.location}
                          </span>
                        </>
                      )}

                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied on {formatDate(app.created_at)}
                      </span>
                    </div>

                    {app.resume && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Resume attached: {app.resume.file_name}</span>
                      </div>
                    )}

                    {app.cover_letter && (
                      <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">
                          Your Note:
                        </p>
                        <p className="line-clamp-2">{app.cover_letter}</p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href="/candidate/jobs"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      View All Jobs
                    </Link>
                  </div>
                </div>

                {/* Status Timeline */}
                {app.statusHistory && app.statusHistory.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Application Timeline
                    </p>
                    <div className="space-y-3">
                      {app.statusHistory.map((hist) => (
                        <div
                          key={hist.id}
                          className="flex items-start gap-3 text-xs"
                        >
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-muted">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="font-medium">
                              Status moved to{" "}
                              <span className="font-semibold">
                                {hist.to_status}
                              </span>
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {formatDateTime(hist.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination using shadcn component */}
      {Math.ceil(applications.length / pageSize) > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: Math.ceil(applications.length / pageSize) }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === pageNum}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(pageNum);
                  }}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < Math.ceil(applications.length / pageSize)) setCurrentPage((p) => p + 1);
                }}
                className={currentPage === Math.ceil(applications.length / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
