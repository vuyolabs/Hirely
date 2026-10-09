import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { asStringArray } from "@/lib/jobs";
import { JobForm } from "@/components/recruiter/job-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecruiterJobPage({ params }: PageProps) {
  const session = await verifyRecruiter();
  const { id } = await params;

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true, company_name: true },
  });

  if (!recruiter) {
    redirect("/login");
  }

  const job = await prisma.job.findFirst({
    where: { id, recruiterId: recruiter.id },
  });

  if (!job) {
    notFound();
  }

  const str = (n: number | null) => (n == null ? "" : String(n));

  return (
    <JobForm
      companyName={recruiter.company_name}
      job={{
        id: job.id,
        status: job.status,
        values: {
          title: job.title,
          department: job.department ?? "",
          employment_type: job.employment_type,
          experience_level: job.experience_level,
          openings: String(job.openings),
          work_mode: job.work_mode,
          locations: asStringArray(job.locations),
          min_experience: String(job.min_experience),
          max_experience: str(job.max_experience),
          salary_min: str(job.salary_min),
          salary_max: str(job.salary_max),
          salary_disclosed: job.salary_disclosed,
          skills: asStringArray(job.skills),
          nice_to_have_skills: asStringArray(job.nice_to_have_skills),
          description: job.description,
          education: job.education ?? "",
          benefits: asStringArray(job.benefits),
          resume_required: job.resume_required,
          application_deadline: job.application_deadline
            ? job.application_deadline.toISOString().slice(0, 10)
            : "",
        },
      }}
    />
  );
}
