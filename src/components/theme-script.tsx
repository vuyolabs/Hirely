"use client";

import { themeInitScript } from "@/lib/theme";

/*
 * Rendered only into the server HTML, where it runs before first paint
 * so dark mode never flashes white. On the client it renders nothing:
 * React won't execute client-rendered scripts (and warns about them),
 * and it skips the leftover server <script> when hydrating <head>.
 */
export function ThemeScript() {
  if (typeof window !== "undefined") return null;

  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
