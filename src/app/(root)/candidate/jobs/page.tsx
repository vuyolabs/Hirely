import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifyCandidate } from "@/lib/dal";
import { asStringArray } from "@/lib/jobs";
import { parseJobFilters, parseJobPage } from "@/lib/job-search";
import { searchJobs } from "@/lib/job-search.server";
import { candidateExperienceYears } from "@/lib/recommendations";
import { PageHeader } from "@/components/dashboard/primitives";
import { JobsView } from "@/components/candidate/jobs-view";

export default async function CandidateJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await verifyCandidate();
  const query = await searchParams;

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    include: {
      resumes: {
        where: { status: { not: "ARCHIVED" } },
        select: { id: true, file_name: true },
      },
      applications: {
        select: { jobId: true },
      },
    },
  });

  if (!candidate) redirect("/onboarding");

  const profile = {
    skills: candidate.skills,
    experience: candidate.experience,
    preferences: candidate.preferences,
    location: candidate.location,
    headline: candidate.headline,
  };

  // First page is rendered on the server; the client takes over from the API.
  const filters = parseJobFilters(query);
  const initialResult = await searchJobs(
    { candidateId: candidate.id, profile },
    filters,
    { page: parseJobPage(query).page, pageSize: parseJobPage({}).pageSize },
  );

  const prefs = (candidate.preferences as Record<string, unknown>) || {};

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Find jobs"
        title="Jobs matched to your skills"
        description="Every role is scored against your profile. Filter, sort by best match, and apply in one click."
      />

      <JobsView
        initialFilters={filters}
        initialResult={initialResult}
        appliedJobIds={candidate.applications.map((a) => a.jobId)}
        savedJobIds={asStringArray(prefs.savedJobs)}
        candidateResumes={candidate.resumes}
        myPreferences={{
          experienceYears: Math.floor(candidateExperienceYears(profile)),
          locations: asStringArray(prefs.preferredLocations),
          workModes: asStringArray(prefs.workModes),
          jobTypes: asStringArray(prefs.jobTypes),
        }}
      />
    </div>
  );
}
