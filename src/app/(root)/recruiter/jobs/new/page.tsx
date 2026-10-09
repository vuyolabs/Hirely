import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { JobForm } from "@/components/recruiter/job-form";

export default async function NewJobPage() {
  const session = await verifyRecruiter();
  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
    select: { company_name: true },
  });

  return <JobForm companyName={recruiter?.company_name ?? null} />;
}
