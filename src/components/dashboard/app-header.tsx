"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Moon, Sun } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const LABELS: Record<string, string> = {
  candidate: "Dashboard",
  recruiter: "Dashboard",
  admin: "Overview",
  jobs: "Jobs",
  new: "New job",
  edit: "Edit",
  applications: "Applications",
  saved: "Saved jobs",
  profile: "Profile",
  settings: "Settings",
  users: "Users",
  audit: "Audit trail",
};

function labelFor(segment: string) {
  if (LABELS[segment]) return LABELS[segment];
  // Record ids (cuid/uuid) get a generic label.
  if (/^[a-z0-9-]{20,}$/i.test(segment)) return "Details";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function AppHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, i) => ({
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: labelFor(segment),
  }));

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4 mt-2" />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={crumb.href}>
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                )}
                <li className="min-w-0">
                  {last ? (
                    <span
                      aria-current="page"
                      className="block truncate font-medium text-foreground"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="block truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>

      <div className="flex items-center gap-2">
        {children}
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() =>
            setTheme(
              document.documentElement.classList.contains("dark")
                ? "light"
                : "dark",
            )
          }
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </button>
      </div>
    </header>
  );
}
