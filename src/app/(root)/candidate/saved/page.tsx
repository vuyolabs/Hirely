import { verifyCandidate, getCandidateSavedJobsData } from "@/lib/dal";
import { redirect } from "next/navigation";
import { CandidateSavedJobsView } from "@/components/candidate/saved-jobs-view";

export default async function SavedJobsPage() {
  const session = await verifyCandidate();
  const savedJobs = await getCandidateSavedJobsData(session.userId);

  if (savedJobs === null) {
    redirect("/onboarding");
  }

  return <CandidateSavedJobsView savedJobs={savedJobs} />;
}

