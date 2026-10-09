"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  FileSpreadsheet,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { Logo } from "@/components/ui/logo";

type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";

type NavItem = { title: string; href: string; icon: LucideIcon };

const CONFIG: Record<
  Role,
  {
    home: string;
    label: string;
    groups: { label: string; items: NavItem[] }[];
    profileUrl: string;
    settingsUrl: string;
    promo?: { title: string; body: string; href: string; cta: string };
  }
> = {
  CANDIDATE: {
    home: "/candidate",
    label: "Candidate",
    profileUrl: "/candidate/profile",
    settingsUrl: "/candidate/settings",
    groups: [
      {
        label: "Job search",
        items: [
          { title: "Dashboard", href: "/candidate", icon: LayoutDashboard },
          { title: "Find jobs", href: "/candidate/jobs", icon: BriefcaseBusiness },
          { title: "Applications", href: "/candidate/applications", icon: FileText },
          { title: "Saved jobs", href: "/candidate/saved", icon: Bookmark },
        ],
      },
      {
        label: "Account",
        items: [
          { title: "Profile", href: "/candidate/profile", icon: User },
          { title: "Settings", href: "/candidate/settings", icon: Settings },
        ],
      },
    ],
    promo: {
      title: "Sharpen your matches",
      body: "Keep your skills up to date to rank higher for the right roles.",
      href: "/candidate/profile",
      cta: "Update profile",
    },
  },
  RECRUITER: {
    home: "/recruiter",
    label: "Employer",
    profileUrl: "/recruiter/profile",
    settingsUrl: "/recruiter/settings",
    groups: [
      {
        label: "Hiring",
        items: [
          { title: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
          { title: "My jobs", href: "/recruiter/jobs", icon: BriefcaseBusiness },
          { title: "Applicants", href: "/recruiter/applications", icon: Users },
        ],
      },
      {
        label: "Account",
        items: [
          { title: "Company profile", href: "/recruiter/profile", icon: Building2 },
          { title: "Settings", href: "/recruiter/settings", icon: Settings },
        ],
      },
    ],
    promo: {
      title: "Hiring for a new role?",
      body: "Post it with required skills and get pre-scored applicants.",
      href: "/recruiter/jobs/new",
      cta: "Post a job",
    },
  },
  ADMIN: {
    home: "/admin",
    label: "Admin",
    profileUrl: "/admin",
    settingsUrl: "/admin/settings",
    groups: [
      {
        label: "Administration",
        items: [
          { title: "Overview", href: "/admin", icon: LayoutDashboard },
          { title: "Users", href: "/admin/users", icon: Users },
          { title: "Companies", href: "/admin/companies", icon: Building2 },
          { title: "Job moderation", href: "/admin/jobs", icon: Briefcase },
          { title: "Applications", href: "/admin/applications", icon: FileSpreadsheet },
          { title: "Audit trail", href: "/admin/audit", icon: History },
        ],
      },
      {
        label: "System",
        items: [{ title: "Settings", href: "/admin/settings", icon: Settings }],
      },
    ],
  },
};

export function AppSidebar({
  role,
  user,
  subtitle,
}: {
  role: Role;
  user: { name: string; email: string };
  subtitle?: string | null;
}) {
  const pathname = usePathname();
  const config = CONFIG[role];

  // Exact match for the dashboard root, prefix match for sections,
  // but "/recruiter/jobs/new" shouldn't light up both items.
  const isActive = (href: string) =>
    href === config.home
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link href={config.home} className="flex items-center justify-between">
          <Logo size="md" />
          <span className="rounded-md border border-sidebar-border bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {config.label}
          </span>
        </Link>
        {subtitle && (
          <p className="mt-1 truncate px-0.5 text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </SidebarHeader>

      <SidebarContent>
        {config.groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.title}
                        className="h-9 data-active:bg-primary/10 data-active:text-primary data-active:font-semibold [&_svg]:text-muted-foreground data-active:[&_svg]:text-primary"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {config.promo && (
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5 group-data-[collapsible=icon]:hidden">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold">{config.promo.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {config.promo.body}
            </p>
            <Link
              href={config.promo.href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {config.promo.cta}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
        <NavUser
          user={{
            ...user,
            role,
            profileUrl: config.profileUrl,
            settingsUrl: config.settingsUrl,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
