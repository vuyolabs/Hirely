"use client";

import { formatDate } from "@/lib/format";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Eye,
  Mail,
  MapPin,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateApplicationStatus } from "@/actions/recruiter";
import { ApplicationStatus } from "@/generated/prisma/enums";

export type ApplicantItem = {
  id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: Date | string;
  job: {
    id: string;
    title: string;
  };
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    location: string | null;
    headline: string | null;
    summary: string | null;
    skills: unknown;
    experience: unknown;
    education: unknown;
    projects: unknown;
    user: {
      email: string;
    };
  };
  resume: {
    id: string;
    file_name: string;
  } | null;
  statusHistory: {
    id: string;
    from_status: string | null;
    to_status: string;
    created_at: Date | string;
  }[];
};

export type PipelineViewProps = {
  initialApplicants: ApplicantItem[];
  jobs: { id: string; title: string }[];
  initialJobFilter?: string;
};

export function PipelineView({
  initialApplicants,
  jobs,
  initialJobFilter = "ALL",
}: PipelineViewProps) {
  const [selectedJob, setSelectedJob] = useState<string>(initialJobFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isPending, startTransition] = useTransition();

  const filteredApplicants = initialApplicants.filter((app) => {
    const matchesJob = selectedJob === "ALL" || app.job.id === selectedJob;
    const matchesStatus = selectedStatus === "ALL" || app.status === selectedStatus;
    return matchesJob && matchesStatus;
  });

  const handleStatusUpdate = (applicationId: string, newStatus: ApplicationStatus) => {
    startTransition(async () => {
      await updateApplicationStatus(applicationId, newStatus);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return <Badge variant="secondary">Applied</Badge>;
      case "SCREENING":
        return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Screening</Badge>;
      case "SHORTLISTED":
        return <Badge variant="default" className="bg-blue-600">Shortlisted</Badge>;
      case "INTERVIEW":
        return <Badge variant="default" className="bg-purple-600">Interview</Badge>;
      case "HIRED":
        return <Badge variant="default" className="bg-emerald-600">Hired</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-56">
              <Select
                value={selectedJob}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedJob(val);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Jobs ({jobs.length})</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="SCREENING">Screening</SelectItem>
                  <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="HIRED">Hired</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredApplicants.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, filteredApplicants.length)} of {filteredApplicants.length} applicants
          </p>
        </CardContent>
      </Card>

      {/* Applicants List */}
      {filteredApplicants.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold">No candidates found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            No applicants match the selected job or status filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplicants
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((app) => (
            <Card
              key={app.id}
              className="transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-semibold text-base">
                      {app.candidate.first_name} {app.candidate.last_name}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>

                  {app.candidate.headline && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {app.candidate.headline}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {app.job.title}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {app.candidate.user.email}
                    </span>
                    {app.candidate.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {app.candidate.location}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(app.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/recruiter/applications/${app.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "gap-1.5",
                    })}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Review Profile</span>
                  </Link>

                  <Select
                    value={app.status}
                    onValueChange={(val) => {
                      if (val) {
                        handleStatusUpdate(app.id, val as ApplicationStatus);
                      }
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger size="sm" className="w-36 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPLIED">Applied</SelectItem>
                      <SelectItem value="SCREENING">Screening</SelectItem>
                      <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                      <SelectItem value="INTERVIEW">Interview</SelectItem>
                      <SelectItem value="HIRED">Hired</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination using shadcn component */}
      {Math.ceil(filteredApplicants.length / pageSize) > 1 && (
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

            {Array.from({ length: Math.ceil(filteredApplicants.length / pageSize) }, (_, i) => i + 1).map((pageNum) => (
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
                  if (currentPage < Math.ceil(filteredApplicants.length / pageSize)) setCurrentPage((p) => p + 1);
                }}
                className={currentPage === Math.ceil(filteredApplicants.length / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
