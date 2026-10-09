import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { notFound } from "next/navigation";
import {
  ApplicantReviewView,
  type ApplicantReviewData,
} from "@/components/recruiter/applicant-review-view";

export default async function RecruiterApplicantReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifyRecruiter();
  const { id } = await params;

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!recruiter) {
    notFound();
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          employment_type: true,
          experience_level: true,
          recruiterId: true,
        },
      },
      candidate: {
        include: {
          user: {
            select: { email: true },
          },
        },
      },
      resume: {
        select: { id: true, file_name: true },
      },
      statusHistory: {
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!application || application.job.recruiterId !== recruiter.id) {
    notFound();
  }

  return <ApplicantReviewView application={application as unknown as ApplicantReviewData} />;
}