"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

/** Compact light/dark switch for marketing, auth and onboarding screens. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark",
        )
      }
      aria-label="Toggle theme"
      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), className)}
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
