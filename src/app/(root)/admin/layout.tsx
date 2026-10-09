import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await verifyAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });

  return (
    <SidebarProvider>
      <AppSidebar
        role="ADMIN"
        user={{
          name: "System Administrator",
          email: user?.email || "admin@hirely.com",
        }}
      />

      <SidebarInset>
        <AppHeader>
          <span className="hidden items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-500/20 sm:inline-flex dark:text-rose-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin access
          </span>
        </AppHeader>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
