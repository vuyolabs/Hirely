import { verifyAdmin, getAdminApplicationsData } from "@/lib/dal";
import { AdminApplicationsView } from "@/components/admin/applications-view";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await verifyAdmin();
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const data = await getAdminApplicationsData(currentPage, 10);

  return <AdminApplicationsView data={data} />;
}

