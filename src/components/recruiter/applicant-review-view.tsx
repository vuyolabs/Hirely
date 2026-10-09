"use client";

import { formatDate, formatDateTime } from "@/lib/format";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { updateApplicationStatus } from "@/actions/recruiter";
import { ApplicationStatus } from "@/generated/prisma/enums";
import type {
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
} from "@/lib/types/candidate";

export type ApplicantReviewData = {
  id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: Date | string;
  job: {
    id: string;
    title: string;
    location: string | null;
    employment_type: string;
    experience_level: string;
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

export type ApplicantReviewViewProps = {
  application: ApplicantReviewData;
};

export function ApplicantReviewView({ application }: ApplicantReviewViewProps) {
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(application.status);
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (newStatus: ApplicationStatus) => {
    setCurrentStatus(newStatus);
    startTransition(async () => {
      await updateApplicationStatus(application.id, newStatus);
    });
  };

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
          <Badge variant="default" className="bg-blue-600 text-white">
            Shortlisted
          </Badge>
        );
      case "INTERVIEW":
        return (
          <Badge variant="default" className="bg-purple-600 text-white">
            Interview
          </Badge>
        );
      case "HIRED":
        return (
          <Badge variant="default" className="bg-emerald-600 text-white">
            Hired
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const skills = Array.isArray(application.candidate.skills)
    ? application.candidate.skills.filter((s): s is string => typeof s === "string")
    : [];

  const experiences: CandidateExperience[] = Array.isArray(application.candidate.experience)
    ? (application.candidate.experience as unknown as CandidateExperience[])
    : [];

  const educations: CandidateEducation[] = Array.isArray(application.candidate.education)
    ? (application.candidate.education as unknown as CandidateEducation[])
    : [];

  const projects: CandidateProject[] = Array.isArray(application.candidate.projects)
    ? (application.candidate.projects as unknown as CandidateProject[])
    : [];

  const STAGES: ApplicationStatus[] = [
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "HIRED",
    "REJECTED",
  ];

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          href="/recruiter/applications"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "gap-1.5 pl-0 text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidate Pipeline
        </Link>
      </div>

      {/* Hero Candidate Card */}
      <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
              {application.candidate.first_name.charAt(0)}
              {application.candidate.last_name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {application.candidate.first_name} {application.candidate.last_name}
                </h1>
                {getStatusBadge(currentStatus)}
              </div>

              {application.candidate.headline && (
                <p className="text-sm font-medium text-foreground">
                  {application.candidate.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                <span>
                  Applied for{" "}
                  <strong className="text-foreground">{application.job.title}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(application.created_at)}
                </span>
                {application.resume && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {application.resume.file_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick contact box */}
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4 text-xs lg:w-72 shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground truncate">
                {application.candidate.user.email}
              </span>
            </div>

            {application.candidate.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">
                  {application.candidate.phone}
                </span>
              </div>
            )}

            {application.candidate.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">
                  {application.candidate.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline stage switcher bar */}
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Hiring Pipeline Stage
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {STAGES.map((st) => (
              <Button
                key={st}
                variant={currentStatus === st ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusUpdate(st)}
                disabled={isPending}
                className="text-xs font-semibold"
              >
                {st}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* About / Summary */}
          {application.candidate.summary && (
            <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold">About / Summary</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground whitespace-pre-line">
                {application.candidate.summary}
              </p>
            </Card>
          )}

          {/* Candidate Note / Cover Letter */}
          {application.cover_letter && (
            <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold">Candidate Note / Cover Letter</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground whitespace-pre-line bg-muted/20 p-4 rounded-xl border">
                {application.cover_letter}
              </p>
            </Card>
          )}

          {/* Work Experience */}
          {experiences.length > 0 && (
            <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold">Work Experience</h2>
              <div className="mt-4 space-y-4">
                {experiences.map((exp: CandidateExperience, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 text-sm space-y-1.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground text-base">
                        {exp.title}
                      </p>
                      {(exp.startDate || exp.endDate) && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {exp.startDate} – {exp.endDate || "Present"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {exp.company}
                    </p>
                    {exp.description && (
                      <p className="pt-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold">Projects</h2>
              <div className="mt-4 space-y-4">
                {projects.map((proj: CandidateProject, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 text-sm space-y-1.5 transition-colors hover:bg-muted/30"
                  >
                    <p className="font-semibold text-foreground text-base">
                      {proj.name}
                    </p>
                    {proj.description && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {proj.description}
                      </p>
                    )}
                    {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.technologies.map((t: string, tidx: number) => (
                          <Badge key={tidx} variant="outline" className="text-[11px] font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold">Education</h2>
              <div className="mt-4 space-y-3">
                {educations.map((edu: CandidateEducation, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 text-sm space-y-1 transition-colors hover:bg-muted/30"
                  >
                    <p className="font-semibold text-foreground">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      {[edu.degree, edu.field].filter(Boolean).join(" · ")}
                    </p>
                    {(edu.startDate || edu.endDate) && (
                      <p className="text-[11px] text-muted-foreground">
                        {edu.startDate} – {edu.endDate || "Present"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Extracted Skills Card */}
          <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">Extracted Skills</h2>
            <CardDescription className="mt-1">
              Skills extracted from candidate profile & resume
            </CardDescription>

            {skills.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">No skills listed.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Target Job Info Card */}
          <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">Target Position</h2>
            <div className="mt-4 space-y-2 text-xs">
              <p className="font-semibold text-sm text-foreground">
                {application.job.title}
              </p>
              {application.job.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{application.job.location}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline">
                  {application.job.employment_type.replace("_", " ")}
                </Badge>
                <Badge variant="outline">{application.job.experience_level}</Badge>
              </div>
            </div>
          </Card>

          {/* Timeline History */}
          {application.statusHistory && application.statusHistory.length > 0 && (
            <Card className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold">Stage History</h2>
              <div className="mt-4 space-y-3">
                {application.statusHistory.map((hist) => (
                  <div key={hist.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-muted">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Moved to <span className="font-semibold">{hist.to_status}</span>
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(hist.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
