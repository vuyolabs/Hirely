import { verifyAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemeToggleCard } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function AdminSettingsPage() {
  const session = await verifyAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide administration settings, theme customization, and credentials.
        </p>
      </div>

      <div className="grid gap-6">
        <ThemeToggleCard />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Administrator Account</CardTitle>
            </div>
            <CardDescription>
              Details for your super-admin privileged session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role Scope</Label>
                <Input value="Super Administrator" disabled />
              </div>

              <div className="space-y-1.5">
                <Label>Admin Email</Label>
                <Input value={user.email} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security & Sessions</CardTitle>
            </div>
            <CardDescription>
              Manage session and security tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-medium">Reset Password</p>
                <p className="text-xs text-muted-foreground">
                  Update administrator password via email verification.
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
                  Terminate your active administrator session.
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
