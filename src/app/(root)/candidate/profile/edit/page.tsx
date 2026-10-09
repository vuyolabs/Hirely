import { prisma } from "@/lib/prisma";
import { verifyCandidate } from "@/lib/dal";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/components/candidate/edit-profile-form";
import type { CandidateEducation, CandidateExperience, CandidateProject } from "@/lib/types/candidate";

export default async function EditProfilePage() {
  const session = await verifyCandidate();

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!candidate) redirect("/onboarding");

  const skills = Array.isArray(candidate.skills)
    ? candidate.skills.filter((s): s is string => typeof s === "string")
    : [];

  const experience: CandidateExperience[] = Array.isArray(candidate.experience)
    ? (candidate.experience as unknown as CandidateExperience[])
    : [];

  const education: CandidateEducation[] = Array.isArray(candidate.education)
    ? (candidate.education as unknown as CandidateEducation[])
    : [];

  const projects: CandidateProject[] = Array.isArray(candidate.projects)
    ? (candidate.projects as unknown as CandidateProject[])
    : [];

  return (
    <EditProfileForm
      profile={{
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        headline: candidate.headline,
        location: candidate.location,
        phone: candidate.phone,
        summary: candidate.summary,
        skills,
        experience,
        education,
        projects,
      }}
    />
  );
}
