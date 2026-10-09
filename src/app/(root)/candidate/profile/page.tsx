import { verifyCandidate, getCandidateFullProfile } from "@/lib/dal";
import { redirect } from "next/navigation";
import { CandidateProfileView } from "@/components/candidate/edit-profile-dialog";
import type {
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
} from "@/lib/types/candidate";

export default async function CandidateProfilePage() {
  const session = await verifyCandidate();
  const candidate = await getCandidateFullProfile(session.userId);

  if (!candidate) {
    redirect("/onboarding");
  }

  const skills = Array.isArray(candidate.skills)
    ? candidate.skills.filter(
        (skill): skill is string => typeof skill === "string",
      )
    : [];

  const experience: CandidateExperience[] = Array.isArray(candidate.experience)
    ? (candidate.experience as CandidateExperience[])
    : [];

  const education: CandidateEducation[] = Array.isArray(candidate.education)
    ? (candidate.education as CandidateEducation[])
    : [];

  const projects: CandidateProject[] = Array.isArray(candidate.projects)
    ? (candidate.projects as CandidateProject[])
    : [];

  return (
    <CandidateProfileView
      candidate={candidate}
      skills={skills}
      experience={experience}
      education={education}
      projects={projects}
    />
  );
}

