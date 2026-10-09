import { verifyAdmin, getAdminDashboardData } from "@/lib/dal";
import { AdminDashboardView } from "@/components/admin/dashboard-view";

export default async function AdminDashboard() {
  await verifyAdmin();
  const data = await getAdminDashboardData();

  return <AdminDashboardView data={data} />;
}

