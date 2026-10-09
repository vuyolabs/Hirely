"use client";

import { formatDate } from "@/lib/format";
import { useState, useTransition } from "react";
import { PauseCircle, Search, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { moderateJob } from "@/actions/admin";

export type ModerationJob = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  employment_type: string;
  experience_level: string;
  created_at: Date | string;
  recruiter: {
    company_name: string | null;
    user: {
      email: string;
    };
  };
  _count: {
    applications: number;
  };
};

export type JobsModerationProps = {
  initialJobs: ModerationJob[];
};

export function JobsModeration({ initialJobs }: JobsModerationProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  const filteredJobs = initialJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.recruiter.company_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      job.recruiter.user.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (jobId: string, action: "CLOSE" | "DELETE") => {
    if (
      action === "DELETE" &&
      !confirm("Are you sure you want to completely delete this job posting?")
    ) {
      return;
    }

    startTransition(async () => {
      await moderateJob(jobId, action);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-70">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by title, company, or recruiter email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9"
              />
            </div>

            <div className="w-40">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  if (val) {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredJobs.length} listings
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company / Recruiter</TableHead>
              <TableHead>Type & Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Moderation</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-xs text-muted-foreground"
                >
                  No job postings match your filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-semibold text-xs">
                      {job.title}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div>
                        <p className="font-medium text-foreground">
                          {job.recruiter.company_name || "Company"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {job.recruiter.user.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {job.employment_type.replace("_", " ")} •{" "}
                      {job.experience_level}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          job.status === "PUBLISHED"
                            ? "default"
                            : job.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {job.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-semibold">
                      {job._count.applications}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(job.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status === "PUBLISHED" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(job.id, "CLOSE")}
                            disabled={isPending}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                          >
                            <PauseCircle className="mr-1 h-3 w-3" />
                            Close
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleAction(job.id, "DELETE")}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </Card>

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
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from(
              { length: Math.ceil(filteredJobs.length / pageSize) },
              (_, i) => i + 1,
            ).map((pageNum) => (
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
                  if (currentPage < Math.ceil(filteredJobs.length / pageSize))
                    setCurrentPage((p) => p + 1);
                }}
                className={
                  currentPage === Math.ceil(filteredJobs.length / pageSize)
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
