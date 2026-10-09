import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  IBM_Plex_Sans,
  Source_Sans_3,
  Instrument_Serif,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-display",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});


import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});


export const metadata: Metadata = {
  title: "Hirely — Hire for skills, not keywords",
  description:
    "Hirely turns resumes into structured profiles, ranks roles by real skills, and keeps candidates and recruiters on one transparent pipeline.",
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        plusJakartaSans.variable,
        instrumentSerif.variable,
        "font-sans",
        ibmPlexSans.variable,
        sourceSans3Heading.variable
      )}

    >
      <head>
        <ThemeScript />
      </head>

      {/* Extensions (Grammarly, password managers…) add attributes to <body>. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
