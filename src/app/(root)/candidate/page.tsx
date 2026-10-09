import { verifyCandidate, getCandidateDashboardData } from "@/lib/dal";
import { redirect } from "next/navigation";
import { CandidateDashboardView } from "@/components/candidate/dashboard-view";

export default async function CandidateDashboard() {
  const session = await verifyCandidate();
  const data = await getCandidateDashboardData(session.userId);

  if (!data) {
    redirect("/onboarding");
  }

  return <CandidateDashboardView data={data} />;
}

