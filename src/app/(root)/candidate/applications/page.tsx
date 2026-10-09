import { verifyCandidate, getCandidateApplicationsData } from "@/lib/dal";
import { redirect } from "next/navigation";
import { CandidateApplicationsView } from "@/components/candidate/applications-view";

export default async function CandidateApplicationsPage() {
  const session = await verifyCandidate();
  const applications = await getCandidateApplicationsData(session.userId);

  if (applications === null) {
    redirect("/onboarding");
  }

  return <CandidateApplicationsView applications={applications} />;
}

