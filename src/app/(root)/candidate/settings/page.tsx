import { verifyCandidate } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldCheck, User } from "lucide-react";
import { ThemeToggleCard } from "@/components/theme-toggle";

export default async function CandidateSettingsPage() {
  const session = await verifyCandidate();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { candidateProfile: true },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information, theme preferences, and credentials.
        </p>
      </div>

      <div className="grid gap-6">
        <ThemeToggleCard />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Account Details</CardTitle>
            </div>
            <CardDescription>
              Basic information associated with your login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={`${user.candidateProfile?.first_name || ""} ${user.candidateProfile?.last_name || ""}`}
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input value={user.email} disabled />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              To update your name and details, visit your{" "}
              <a href="/candidate/profile" className="underline text-foreground">
                profile page
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Authentication and security settings for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-xs text-muted-foreground">
                  Job Seeker / Candidate
                </p>
              </div>
              <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                {user.role}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-medium">Reset Password</p>
                <p className="text-xs text-muted-foreground">
                  Forgot your password or want to set a new one?
                </p>
              </div>
              <a
                href="/forgot-password"
                className="text-xs font-semibold text-neutral-900 underline dark:text-white"
              >
                Reset via Email
              </a>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Sign Out</p>
                <p className="text-xs text-muted-foreground">
                  End your current session on this device.
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
