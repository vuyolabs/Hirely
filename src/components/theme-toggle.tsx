"use client";

import { useTheme } from "@/components/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggleCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-muted-foreground dark:hidden" />
          <Moon className="h-5 w-5 text-muted-foreground hidden dark:block" />
          <CardTitle>Appearance & Theme</CardTitle>
        </div>
        <CardDescription>
          Customize how Hirely looks on your device. Choose light, dark, or
          system mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-semibold transition-all ${
              theme === "light"
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-semibold transition-all ${
              theme === "dark"
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-semibold transition-all ${
              theme === "system"
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Monitor className="h-5 w-5" />
            <span>System</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
