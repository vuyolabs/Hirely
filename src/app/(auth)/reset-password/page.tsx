import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password · Hirely",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; code?: string }>;
}) {
  const { email, code } = await searchParams;

  return (
    <ResetPasswordForm
      initialEmail={email ?? ""}
      initialCode={code && /^\d{6}$/.test(code) ? code : ""}
    />
  );
}
