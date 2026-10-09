import { verifyRecruiter, getRecruiterDashboardData } from "@/lib/dal";
import { redirect } from "next/navigation";
import { RecruiterDashboardView } from "@/components/recruiter/dashboard-view";

export default async function RecruiterDashboard() {
  const session = await verifyRecruiter();
  const data = await getRecruiterDashboardData(session.userId);

  if (!data) {
    redirect("/onboarding");
  }

  return <RecruiterDashboardView data={data} />;
}

