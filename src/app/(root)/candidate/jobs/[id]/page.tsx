import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyCandidate } from "@/lib/dal";
import { JobDetailView } from "@/components/candidate/job-detail-view";
import { asStringArray } from "@/lib/jobs";
import { calculateJobMatch } from "@/lib/recommendations";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateJobDetailPage({ params }: PageProps) {
  const session = await verifyCandidate();
  const { id } = await params;

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    include: {
      resumes: {
        orderBy: { created_at: "desc" },
        where: { status: { not: "ARCHIVED" } },
        take: 1,
        select: { id: true, file_name: true },
      },
      applications: {
        where: { jobId: id },
        select: { id: true },
      },
    },
  });

  if (!candidate) {
    redirect("/onboarding");
  }

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      recruiter: {
        select: {
          company_name: true,
          first_name: true,
          last_name: true,
          job_title: true,
          company: { select: { verification_status: true } },
        },
      },
    },
  });

  if (!job || job.status !== "PUBLISHED") {
    notFound();
  }

  // Check saved state in candidate preferences
  const prefs = (candidate.preferences as Record<string, unknown>) || {};
  const savedJobs = Array.isArray(prefs.savedJobs)
    ? (prefs.savedJobs as string[])
    : [];

  const hasApplied = candidate.applications.length > 0;
  const isSaved = savedJobs.includes(job.id);


  const match = calculateJobMatch(
    {
      skills: candidate.skills,
      experience: candidate.experience,
      preferences: candidate.preferences,
      location: candidate.location,
      headline: candidate.headline,
    },
    job,
  );

  return (
    <JobDetailView
      job={{
        ...job,
        skills: asStringArray(job.skills),
        nice_to_have_skills: asStringArray(job.nice_to_have_skills),
        benefits: asStringArray(job.benefits),
        locations: asStringArray(job.locations),
        companyVerified: job.recruiter.company?.verification_status === "VERIFIED",
      }}
      match={{ score: match.score, matchingSkills: match.matchingSkills }}
      hasApplied={hasApplied}
      isSaved={isSaved}
      resumes={candidate.resumes}
    />
  );
}
