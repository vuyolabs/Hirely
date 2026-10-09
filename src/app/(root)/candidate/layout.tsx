import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifyCandidate } from "@/lib/dal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";

export default async function CandidateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await verifyCandidate();

  const candidate = await prisma.candidateProfile.findUnique({
    where: {
      userId: session.userId,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      headline: true,
      user: {
        select: { email: true },
      },
    },
  });

  if (!candidate) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        role="CANDIDATE"
        user={{
          name: `${candidate.first_name} ${candidate.last_name}`,
          email: candidate.user.email,
        }}
        subtitle={candidate.headline}
      />

      <SidebarInset>
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
