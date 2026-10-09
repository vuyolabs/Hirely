import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { RecruiterProfileForm } from "@/components/recruiter/profile-form";

export default async function RecruiterProfilePage() {
  const session = await verifyRecruiter();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { recruiterProfile: true },
  });

  if (!user || !user.recruiterProfile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization details and recruiter credentials.
        </p>
      </div>

      <RecruiterProfileForm
        initialData={{
          first_name: user.recruiterProfile.first_name,
          last_name: user.recruiterProfile.last_name,
          company_name: user.recruiterProfile.company_name,
          job_title: user.recruiterProfile.job_title,
          email: user.email,
        }}
      />
    </div>
  );
}
