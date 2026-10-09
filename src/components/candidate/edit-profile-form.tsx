"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Save,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  FolderGit2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateCandidateProfile } from "@/actions/candidate";
import Link from "next/link";
import type { CandidateEducation, CandidateExperience, CandidateProject } from "@/lib/types/candidate";

type EditProfileFormProps = {
  profile: {
    first_name: string;
    last_name: string;
    headline: string | null;
    location: string | null;
    phone: string | null;
    summary: string | null;
    skills: string[];
    experience?: CandidateExperience[];
    education?: CandidateEducation[];
    projects?: CandidateProject[];
  };
};

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();

  // Basic Info
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [headline, setHeadline] = useState(profile.headline || "");
  const [location, setLocation] = useState(profile.location || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [summary, setSummary] = useState(profile.summary || "");

  // Skills
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState("");

  // Experience
  const [experience, setExperience] = useState<CandidateExperience[]>(
    profile.experience || []
  );

  // Education
  const [education, setEducation] = useState<CandidateEducation[]>(
    profile.education || []
  );

  // Projects
  const [projects, setProjects] = useState<CandidateProject[]>(
    profile.projects || []
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Skill Handlers
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    setExperience([
      ...experience,
      {
        company: "",
        title: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };

  const handleUpdateExperience = (
    index: number,
    field: keyof CandidateExperience,
    value: string
  ) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Education Handlers
  const handleAddEducation = () => {
    setEducation([
      ...education,
      {
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const handleUpdateEducation = (
    index: number,
    field: keyof CandidateEducation,
    value: string
  ) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Projects Handlers
  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        name: "",
        description: "",
        technologies: [],
      },
    ]);
  };

  const handleUpdateProject = (
    index: number,
    field: keyof CandidateProject,
    value: CandidateProject[keyof CandidateProject]
  ) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateCandidateProfile({
        first_name: firstName,
        last_name: lastName,
        headline,
        location,
        phone,
        summary,
        skills,
        experience: experience.filter((e) => e.company.trim() || e.title.trim()),
        education: education.filter((e) => e.institution.trim()),
        projects: projects.filter((p) => p.name.trim()),
      });

      if (res.error) {
        setError(res.error);
      } else {
        router.push("/candidate/profile");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/candidate/profile"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Candidate Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update all personal details, work history, education, and portfolio projects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>Your name and contact details visible to recruiters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Professional Summary & Bio</CardTitle>
            <CardDescription>Help recruiters understand your background, seniority, and goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                placeholder="e.g. Senior Full Stack Engineer | React & Node.js"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="summary">About / Bio</Label>
              <Textarea
                id="summary"
                placeholder="Brief summary of your background, achievements, and career goals..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-32 text-sm leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills & Competencies</CardTitle>
            <CardDescription>Add technologies, languages, and tools you specialize in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g. TypeScript, AWS, Next.js)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={() => handleAddSkill()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
              {skills.length === 0 && (
                <p className="text-xs text-muted-foreground">No skills added yet.</p>
              )}
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1.5 pr-1 text-xs font-medium">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Work Experience
              </CardTitle>
              <CardDescription>Your career history, previous employers, and roles.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddExperience}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Position
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No work experience recorded. Click &quot;Add Position&quot; to add your roles.
              </p>
            ) : (
              experience.map((exp, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Position #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveExperience(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Job Title</Label>
                      <Input
                        placeholder="e.g. Senior Frontend Engineer"
                        value={exp.title}
                        onChange={(e) =>
                          handleUpdateExperience(index, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Company Name</Label>
                      <Input
                        placeholder="e.g. Acme Technologies"
                        value={exp.company}
                        onChange={(e) =>
                          handleUpdateExperience(index, "company", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        placeholder="e.g. Jan 2021"
                        value={exp.startDate || ""}
                        onChange={(e) =>
                          handleUpdateExperience(index, "startDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        placeholder="e.g. Present or Dec 2023"
                        value={exp.endDate || ""}
                        onChange={(e) =>
                          handleUpdateExperience(index, "endDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Responsibilities & Achievements</Label>
                    <Textarea
                      placeholder="Bullet points or summary of your key contributions and outcomes..."
                      value={exp.description || ""}
                      onChange={(e) =>
                        handleUpdateExperience(index, "description", e.target.value)
                      }
                      className="min-h-20 text-xs"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Education & Degrees
              </CardTitle>
              <CardDescription>Degrees, universities, bootcamps, and certifications.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEducation}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Education
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No education recorded. Click &quot;Add Education&quot; to list your degrees.
              </p>
            ) : (
              education.map((edu, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Education #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveEducation(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Institution / University *</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          handleUpdateEducation(index, "institution", e.target.value)
                        }
                        placeholder="e.g. Stanford University"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Degree</Label>
                      <Input
                        value={edu.degree || ""}
                        onChange={(e) =>
                          handleUpdateEducation(index, "degree", e.target.value)
                        }
                        placeholder="e.g. Bachelor of Science"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Field of Study</Label>
                      <Input
                        value={edu.field || ""}
                        onChange={(e) =>
                          handleUpdateEducation(index, "field", e.target.value)
                        }
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        value={edu.startDate || ""}
                        onChange={(e) =>
                          handleUpdateEducation(index, "startDate", e.target.value)
                        }
                        placeholder="YYYY-MM"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        value={edu.endDate || ""}
                        onChange={(e) =>
                          handleUpdateEducation(index, "endDate", e.target.value)
                        }
                        placeholder="YYYY-MM"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-primary" />
                Projects
              </CardTitle>
              <CardDescription>Featured projects, apps, or contributions.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProject}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Project
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No projects listed. Click &quot;Add Project&quot; to show your work.
              </p>
            ) : (
              projects.map((proj, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Project #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveProject(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Project Name *</Label>
                    <Input
                      value={proj.name}
                      onChange={(e) =>
                        handleUpdateProject(index, "name", e.target.value)
                      }
                      placeholder="e.g. Real-Time Chat Engine"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={proj.description || ""}
                      onChange={(e) =>
                        handleUpdateProject(index, "description", e.target.value)
                      }
                      placeholder="Summary of what you built and tech used..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Technologies (comma-separated)</Label>
                    <Input
                      value={(proj.technologies || []).join(", ")}
                      onChange={(e) =>
                        handleUpdateProject(
                          index,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="e.g. Next.js, PostgreSQL, WebSockets"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:border-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="font-semibold">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>

          <Link
            href="/candidate/profile"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
