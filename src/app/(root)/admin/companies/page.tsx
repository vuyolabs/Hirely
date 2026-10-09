import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";
import { PageHeader } from "@/components/dashboard/primitives";
import { CompaniesReview, type CompanyItem } from "@/components/admin/companies-review";

export default async function AdminCompaniesPage() {
  await verifyAdmin();

  const companies: CompanyItem[] = await prisma.company.findMany({
    orderBy: [{ verification_status: "asc" }, { created_at: "desc" }],
    include: {
      recruiters: {
        select: {
          first_name: true,
          last_name: true,
          job_title: true,
          phone: true,
          linkedin_url: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & safety"
        title="Company verification"
        description="Check each employer's GSTIN, PAN and registration against government records (GST portal, MCA) before approving."
      />
      <CompaniesReview companies={companies} />
    </div>
  );
}
