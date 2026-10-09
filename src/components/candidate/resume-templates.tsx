import * as React from "react";
import type { CandidateEducation, CandidateExperience, CandidateProject } from "@/lib/types/candidate";

export type ResumeTemplateId = "modern" | "classic" | "minimal" | "technical";

export type ResumeData = {
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  summary?: string | null;
  skills: string[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  projects: CandidateProject[];
};

export function ModernResumeTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white text-neutral-900 font-sans p-8 sm:p-12 max-w-[800px] mx-auto shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-left">
      {/* Header */}
      <div className="border-b-2 border-neutral-900 pb-5 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 uppercase">
          {data.fullName}
        </h1>
        {data.headline && (
          <p className="text-base font-semibold text-neutral-600 mt-1">
            {data.headline}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 mt-2.5">
          <span>{data.email}</span>
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
            {data.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-1 mb-2">
            Skills & Competencies
          </h2>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-neutral-100 text-neutral-800 text-[11px] font-medium px-2.5 py-0.5 rounded border border-neutral-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-1 mb-3">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-neutral-900 text-sm">{exp.title}</h3>
                  <span className="text-neutral-500 text-[11px] font-medium">
                    {exp.startDate || ""} — {exp.endDate || "Present"}
                  </span>
                </div>
                <p className="font-semibold text-neutral-700 text-xs mb-1.5">{exp.company}</p>
                {exp.description && (
                  <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-1 mb-3">
            Projects
          </h2>
          <div className="space-y-3.5">
            {data.projects.map((proj, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-neutral-900">{proj.name}</h3>
                </div>
                {proj.description && (
                  <p className="text-neutral-600 leading-relaxed mt-0.5">
                    {proj.description}
                  </p>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                    Tech Stack: {proj.technologies.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-1 mb-3">
            Education & Certifications
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className="text-xs flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-neutral-900">{edu.institution}</h3>
                  <p className="text-neutral-600">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  </p>
                </div>
                {(edu.startDate || edu.endDate) && (
                  <span className="text-neutral-500 text-[11px]">
                    {edu.startDate || ""} — {edu.endDate || ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClassicResumeTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white text-neutral-900 font-serif p-8 sm:p-12 max-w-[800px] mx-auto shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-left">
      {/* Header Centered */}
      <div className="text-center border-b border-neutral-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-normal uppercase text-neutral-950">
          {data.fullName}
        </h1>
        {data.headline && (
          <p className="text-sm italic text-neutral-700 mt-1 font-sans">
            {data.headline}
          </p>
        )}
        <div className="flex justify-center flex-wrap gap-x-3 text-xs text-neutral-600 font-sans mt-2">
          <span>{data.email}</span>
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-900 pb-0.5 mb-2">
            Profile
          </h2>
          <p className="text-xs text-neutral-700 leading-relaxed font-sans">
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-900 pb-0.5 mb-2.5">
            Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="text-xs font-sans">
                <div className="flex justify-between items-baseline font-serif">
                  <span className="font-bold text-sm text-neutral-950">{exp.company}</span>
                  <span className="text-neutral-600 text-xs italic">
                    {exp.startDate || ""} - {exp.endDate || "Present"}
                  </span>
                </div>
                <p className="font-semibold text-neutral-800 italic mb-1">{exp.title}</p>
                {exp.description && (
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line text-xs">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-900 pb-0.5 mb-2.5">
            Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx} className="text-xs font-sans flex justify-between">
                <div>
                  <span className="font-bold text-neutral-900 font-serif">{edu.institution}</span>
                  <p className="text-neutral-700">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </p>
                </div>
                {(edu.startDate || edu.endDate) && (
                  <span className="text-neutral-600 italic">
                    {edu.startDate || ""} - {edu.endDate || ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-900 pb-0.5 mb-2">
            Areas of Expertise
          </h2>
          <p className="text-xs font-sans text-neutral-700 leading-relaxed">
            {data.skills.join(" • ")}
          </p>
        </div>
      )}
    </div>
  );
}

export function TechnicalResumeTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white text-neutral-900 font-sans p-8 sm:p-12 max-w-[800px] mx-auto shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-left">
      {/* Left accent border header */}
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
          {data.fullName}
        </h1>
        {data.headline && (
          <p className="text-sm font-semibold text-primary mt-0.5">
            {data.headline}
          </p>
        )}
        <p className="text-xs text-neutral-600 mt-1.5 font-mono">
          {data.email} {data.phone ? `| ${data.phone}` : ""} {data.location ? `| ${data.location}` : ""}
        </p>
      </div>

      {/* Technical Skills Box */}
      {data.skills.length > 0 && (
        <div className="mb-6 bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 mb-2 font-mono">
            &gt; Core Technical Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-white text-neutral-800 text-[11px] font-mono px-2 py-0.5 rounded border border-neutral-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 border-neutral-100 pb-1 mb-3 font-mono">
            {"//"} Professional History
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-neutral-950 text-sm">{exp.title}</span>
                  <span className="font-mono text-[11px] text-neutral-500">
                    {exp.startDate || ""} — {exp.endDate || "Present"}
                  </span>
                </div>
                <p className="text-primary font-medium text-xs mb-1">{exp.company}</p>
                {exp.description && (
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line text-xs">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 border-neutral-100 pb-1 mb-3 font-mono">
            {"//"} Engineering Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((proj, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-950">{proj.name}</span>
                </div>
                {proj.description && (
                  <p className="text-neutral-700 leading-relaxed mt-0.5">
                    {proj.description}
                  </p>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="text-[10px] font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 border-neutral-100 pb-1 mb-2 font-mono">
            {"//"} Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx} className="text-xs flex justify-between">
                <div>
                  <span className="font-bold text-neutral-900">{edu.institution}</span>
                  <p className="text-neutral-600">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </p>
                </div>
                {(edu.startDate || edu.endDate) && (
                  <span className="font-mono text-neutral-500 text-[11px]">
                    {edu.startDate || ""} — {edu.endDate || ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
