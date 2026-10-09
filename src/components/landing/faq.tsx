"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    q: "How does the AI resume parsing work?",
    a: "Upload a PDF and our model extracts contact info, skills, work history and education into structured fields. You can review and edit everything before applying.",
  },
  {
    q: "Is my profile visible to the public?",
    a: "No. Your profile and resume are only shared with the recruiter of a role when you apply to it.",
  },
  {
    q: "How are recruiters and jobs verified?",
    a: "Platform admins moderate employer accounts and job postings, and every action is written to an audit log, which keeps spam and fake listings out.",
  },
  {
    q: "Is Hirely free for job seekers?",
    a: "Yes. Uploading resumes, building a profile, searching roles and tracking applications are all free for candidates.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-3xl border border-border bg-card">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-semibold">{item.q}</span>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border transition-all duration-300",
                  isOpen &&
                    "rotate-45 border-primary bg-primary text-primary-foreground",
                )}
              >
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
