import type { ReactNode } from "react";
import { BadgeCheck, Building2, Clock, ShieldAlert } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { verifyRecruiter } from "@/lib/dal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";

export default async function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await verifyRecruiter();

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: {
      userId: session.userId,
    },
    select: {
      id: true,
      company_name: true,
      company: {
        select: { verification_status: true, verification_note: true },
      },
      first_name: true,
      last_name: true,
      user: {
        select: { email: true },
      },
    },
  });

  if (!recruiter) {
    throw new Error("Recruiter profile not found");
  }

  const status = recruiter.company?.verification_status;

  return (
    <SidebarProvider>
      <AppSidebar
        role="RECRUITER"
        user={{
          name: `${recruiter.first_name} ${recruiter.last_name}`,
          email: recruiter.user.email,
        }}
        subtitle={recruiter.company_name}
      />

      <SidebarInset>
        <AppHeader>
          {recruiter.company_name && (
            <span className="hidden items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium sm:inline-flex">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {recruiter.company_name}
              {status === "VERIFIED" && (
                <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Verified company" />
              )}
            </span>
          )}
        </AppHeader>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {status === "PENDING" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>
                <span className="font-semibold">Company verification in progress.</span>{" "}
                <span className="text-muted-foreground">
                  We&apos;re checking {recruiter.company_name}&apos;s GST and registration details, usually within 1–2 business days. You can set up jobs in the meantime.
                </span>
              </p>
            </div>
          )}
          {status === "REJECTED" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p>
                <span className="font-semibold text-destructive">We couldn&apos;t verify your company.</span>{" "}
                <span className="text-muted-foreground">
                  {recruiter.company?.verification_note ?? "The details didn't match government records."} Please contact the Hirely team to resolve this.
                </span>
              </p>
            </div>
          )}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
