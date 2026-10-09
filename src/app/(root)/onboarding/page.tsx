import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { CandidateOnboarding } from "@/components/onboarding/candidate-onboarding";
import { RecruiterOnboarding } from "@/components/onboarding/recruiter-onboarding";

export const metadata: Metadata = {
  title: "Set up your account · Hirely",
};

export default async function OnboardingPage() {
  const session = await verifySession();

  if (session.role === "RECRUITER") {
    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: session.userId },
      select: {
        first_name: true,
        last_name: true,
        company_name: true,
        job_title: true,
        phone: true,
        hiring_for: true,
      },
    });
    if (!recruiter) redirect("/login");

    return (
      <RecruiterOnboarding
        userId={session.userId}
        initial={{
          firstName: recruiter.first_name,
          lastName: recruiter.last_name,
          companyName: recruiter.company_name ?? "",
          jobTitle: recruiter.job_title ?? "",
          phone: recruiter.phone ?? "",
          hiringFor: recruiter.hiring_for,
        }}
      />
    );
  }

  if (session.role === "CANDIDATE") {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
      select: { first_name: true, last_name: true, phone: true, preferences: true },
    });
    if (!candidate) redirect("/login");

    const workStatus = (candidate.preferences as { workStatus?: string } | null)?.workStatus;

    return (
      <CandidateOnboarding
        userId={session.userId}
        initial={{
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          phone: candidate.phone ?? "",
          workStatus:
            workStatus === "EXPERIENCED" || workStatus === "FRESHER" ? workStatus : "",
        }}
      />
    );
  }

  redirect("/admin");
}
