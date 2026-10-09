"use client";

import { formatDate } from "@/lib/format";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Calendar,
  FilePlus2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Trash2,
  Users,
  Pencil,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toggleJobStatus, deleteJob } from "@/actions/recruiter";
import { JobStatus } from "@/generated/prisma/enums";

type JobItem = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  location: string | null;
  employment_type: string;
  experience_level: string;
  created_at: Date | string;
  _count: {
    applications: number;
  };
};

type JobsListProps = {
  initialJobs: JobItem[];
};

export function JobsList({ initialJobs }: JobsListProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  const filteredJobs = initialJobs.filter((job) => {
    if (filter === "ALL") return true;
    return job.status === filter;
  });

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    startTransition(async () => {
      await toggleJobStatus(jobId, newStatus);
    });
  };

  const handleDelete = (jobId: string) => {
    if (
      confirm("Are you sure you want to permanently delete this job posting?")
    ) {
      startTransition(async () => {
        await deleteJob(jobId);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PUBLISHED", "DRAFT", "CLOSED"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(status);
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              {status === "ALL" ? "All Jobs" : status}
            </Button>
          ))}
        </div>

        <Link
          href="/recruiter/jobs/new"
          className={buttonVariants({ className: "gap-1.5 shrink-0" })}
        >
          <FilePlus2 className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Showing count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} job postings
        </span>
      </div>

      {/* Jobs list */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold">
            No job postings in this view
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {filter === "ALL"
              ? "You haven't posted any jobs yet. Create your first opening to begin receiving applicants."
              : `You have no ${filter.toLowerCase()} job listings.`}
          </p>
          <div className="mt-5">
            <Link
              href="/recruiter/jobs/new"
              className={buttonVariants({ size: "sm" })}
            >
              Create Job
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((job) => (
            <Card
              key={job.id}
              className="transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-semibold text-base">{job.title}</h3>
                    <Badge
                      variant={
                        job.status === "PUBLISHED"
                          ? "default"
                          : job.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{job.employment_type.replace("_", " ")}</span>
                    <span>•</span>
                    <span>{job.experience_level}</span>
                    {job.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Posted {formatDate(job.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href={`/recruiter/jobs/${job.id}/edit`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "gap-1.5 text-xs",
                      })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>

                    <Link
                      href={`/recruiter/applications?jobId=${job.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "gap-1.5 text-xs",
                      })}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{job._count.applications} Applicants</span>
                    </Link>

                    {job.status === "PUBLISHED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(job.id, JobStatus.CLOSED)
                        }
                        disabled={isPending}
                        className="text-xs text-muted-foreground hover:text-amber-600"
                      >
                        <PauseCircle className="mr-1 h-3.5 w-3.5" />
                        Close
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(job.id, JobStatus.PUBLISHED)
                        }
                        disabled={isPending}
                        className="text-xs text-muted-foreground hover:text-emerald-600"
                      >
                        <PlayCircle className="mr-1 h-3.5 w-3.5" />
                        Publish
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      disabled={isPending}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination using shadcn component */}
      {Math.ceil(filteredJobs.length / pageSize) > 1 && (
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

            {Array.from({ length: Math.ceil(filteredJobs.length / pageSize) }, (_, i) => i + 1).map((pageNum) => (
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
                  if (currentPage < Math.ceil(filteredJobs.length / pageSize)) setCurrentPage((p) => p + 1);
                }}
                className={currentPage === Math.ceil(filteredJobs.length / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
