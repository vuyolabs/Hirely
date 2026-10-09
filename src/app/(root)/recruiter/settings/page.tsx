import { verifyRecruiter } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemeToggleCard } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function RecruiterSettingsPage() {
  const session = await verifyRecruiter();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { recruiterProfile: true },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employer Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization account, theme preferences, and credentials.
        </p>
      </div>

      <div className="grid gap-6">
        <ThemeToggleCard />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Account Details</CardTitle>
            </div>
            <CardDescription>
              Basic credentials associated with your recruiter account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={`${user.recruiterProfile?.first_name || ""} ${user.recruiterProfile?.last_name || ""}`}
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <Label>Work Email</Label>
                <Input value={user.email} disabled />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              To update your company name and title, visit your{" "}
              <Link href="/recruiter/profile" className="underline text-foreground">
                company profile page
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security & Authentication</CardTitle>
            </div>
            <CardDescription>
              Access control and security for your recruiter account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-medium">Reset Password</p>
                <p className="text-xs text-muted-foreground">
                  Update your account password via email verification.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-neutral-900 underline dark:text-white"
              >
                Reset via Email
              </Link>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Sign Out</p>
                <p className="text-xs text-muted-foreground">
                  Safely end your current session.
                </p>
              </div>
              <SignOutButton
                className={buttonVariants({ variant: "destructive", size: "sm", className: "gap-2" })}
              >
                Sign Out
              </SignOutButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
