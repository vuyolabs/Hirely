"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Building2, MapPin } from "lucide-react";
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

type SavedJob = {
  id: string;
  title: string;
  location: string | null;
  employment_type: string;
  experience_level: string;
  recruiter: {
    company_name: string | null;
  };
};

export function CandidateSavedJobsView({ savedJobs }: { savedJobs: SavedJob[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the roles you&apos;ve bookmarked for later.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold">No saved jobs</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            You haven&apos;t saved any positions yet. Click the bookmark icon on
            any job card to save it here.
          </p>
          <div className="mt-5">
            <Link href="/candidate/jobs" className={buttonVariants()}>
              Explore Jobs
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedJobs
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((job) => (
            <Card key={job.id}>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold">{job.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>
                      {job.recruiter.company_name || "Confidential Company"}
                    </span>
                    {job.location && (
                      <>
                        <span>•</span>
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="secondary">
                      {job.employment_type.replace("_", " ")}
                    </Badge>
                    <Badge variant="secondary">{job.experience_level}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/candidate/jobs"
                    className={buttonVariants({ size: "sm" })}
                  >
                    View & Apply
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination using shadcn component */}
      {Math.ceil(savedJobs.length / pageSize) > 1 && (
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

            {Array.from({ length: Math.ceil(savedJobs.length / pageSize) }, (_, i) => i + 1).map((pageNum) => (
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
                  if (currentPage < Math.ceil(savedJobs.length / pageSize)) setCurrentPage((p) => p + 1);
                }}
                className={currentPage === Math.ceil(savedJobs.length / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
