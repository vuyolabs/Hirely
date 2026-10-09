"use client";

import { useState, useTransition } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateRecruiterProfile } from "@/actions/recruiter";

type RecruiterProfileProps = {
  initialData: {
    first_name: string;
    last_name: string;
    company_name: string | null;
    job_title: string | null;
    email: string;
  };
};

export function RecruiterProfileForm({ initialData }: RecruiterProfileProps) {
  const [firstName, setFirstName] = useState(initialData.first_name);
  const [lastName, setLastName] = useState(initialData.last_name);
  const [companyName, setCompanyName] = useState(initialData.company_name || "");
  const [jobTitle, setJobTitle] = useState(initialData.job_title || "");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await updateRecruiterProfile({
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        job_title: jobTitle,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Employer & Recruiter Profile</CardTitle>
          </div>
          <CardDescription>
            Keep your company and contact information updated for candidate visibility.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Account Email</Label>
            <Input id="email" value={initialData.email} disabled />
            <p className="text-[11px] text-muted-foreground">
              Contact support if you need to alter your login email.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company / Organization</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Technologies"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Head of Talent"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-xs ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t border-border pt-4 pb-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
