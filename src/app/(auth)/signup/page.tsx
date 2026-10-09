import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your account · Hirely",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole =
    role === "recruiter" || role === "employer"
      ? "RECRUITER"
      : role === "candidate"
        ? "CANDIDATE"
        : null;

  return <SignupForm initialRole={initialRole} />;
}
