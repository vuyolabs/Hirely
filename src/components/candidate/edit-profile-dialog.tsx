import Link from "next/link";
import { MapPin, Mail, Phone, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type {
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
} from "@/lib/types/candidate";

type CandidateProfileViewProps = {
  candidate: {
    first_name: string;
    last_name: string;
    headline: string | null;
    location: string | null;
    phone: string | null;
    summary: string | null;
    user: {
      email: string;
    };
  };
  skills: string[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  projects: CandidateProject[];
};

export function CandidateProfileView({
  candidate,
  skills,
  experience,
  education,
  projects,
}: CandidateProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
              {candidate.first_name.charAt(0)}
              {candidate.last_name.charAt(0)}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {candidate.first_name} {candidate.last_name}
              </h1>

              {candidate.headline && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {candidate.headline}
                </p>
              )}

              {candidate.location && (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/candidate/profile/edit"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {candidate.user.email}
          </div>

          {candidate.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {candidate.phone}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        {/* About */}
        {candidate.summary && (
          <section className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">About</h2>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {candidate.summary}
            </p>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">Skills</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {String(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">Experience</h2>

            <div className="mt-5 space-y-6">
              {experience.map((item, index) => (
                <div key={index} className="relative border-l pl-5">
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" />

                  <h3 className="text-sm font-semibold">{item.title}</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.company}
                  </p>

                  {(item.startDate || item.endDate) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.startDate ?? ""}
                      {" — "}
                      {item.endDate ?? "Present"}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">Education</h2>

            <div className="mt-5 space-y-5">
              {education.map((item, index) => (
                <div key={index}>
                  <h3 className="text-sm font-semibold">
                    {item.institution}
                  </h3>

                  {(item.degree || item.field) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[item.degree, item.field]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  {(item.startDate || item.endDate) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.startDate ?? ""}
                      {" — "}
                      {item.endDate ?? ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="rounded-xl border bg-card p-6 shadow-xs ring-1 ring-foreground/10">
            <h2 className="text-base font-semibold">Projects</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-muted/20 p-4"
                >
                  <h3 className="text-sm font-semibold">{project.name}</h3>

                  {project.description && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {project.description}
                    </p>
                  )}

                  {project.technologies?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.map(
                        (technology: string, techIndex: number) => (
                          <span
                            key={techIndex}
                            className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {technology}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
