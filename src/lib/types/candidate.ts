export type CandidateSkill = string;

export type CandidateEducation = {
    institution: string;
    degree: string | null;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
};

export type CandidateExperience = {
    company: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
};

export type CandidateProject = {
    name: string;
    description: string | null;
    technologies: string[];
};

export type JobSummary = {
  id: string;
  title: string;
  description?: string;
  location: string | null;
  employment_type: string;
  experience_level: string;
  status?: string;
  skills?: string[] | null;
  created_at: Date | string;
  matchScore?: number;
  matchingSkills?: string[];
  recruiter: {
    company_name: string | null;
    first_name?: string;
    last_name?: string;
  };
};

export type ApplicationWithJob = {
  id: string;
  status: string;
  created_at: Date | string;
  cover_letter: string | null;
  job: {
    title: string;
    location?: string | null;
    recruiter: {
      company_name: string | null;
    };
  };
  resume?: {
    file_name: string;
  } | null;
  statusHistory?: {
    id: string;
    from_status: string | null;
    to_status: string;
    created_at: Date | string;
  }[];
};

export type CandidateDashboardData = {
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    onboarding_completed: boolean;
  };
  metrics: {
    totalPublishedJobs: number;
    totalApplications: number;
    inProgressApplications: number;
    savedJobsCount: number;
  };
  recentJobs: JobSummary[];
  recentApplications: ApplicationWithJob[];
};

export type RecruiterDashboardData = {
  recruiter: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string | null;
    job_title?: string | null;
  };
  metrics: {
    activeJobsCount: number;
    totalJobsCount: number;
    totalApplications: number;
    activeCandidatesCount: number;
  };
  recentJobs: {
    id: string;
    title: string;
    status: string;
    employment_type: string;
    experience_level: string;
    location: string | null;
    created_at: Date | string;
    _count: {
      applications: number;
    };
  }[];
  recentApplications: {
    id: string;
    status: string;
    candidate: {
      first_name: string;
      last_name: string;
      headline: string | null;
    };
    job: {
      id: string;
      title: string;
    };
  }[];
};

export type AdminDashboardData = {
  metrics: {
    totalUsers: number;
    totalCandidates: number;
    totalRecruiters: number;
    totalAdmins: number;
    totalJobs: number;
    publishedJobs: number;
    totalApplications: number;
    totalAuditLogs: number;
  };
  recentAudits: {
    id: string;
    action: string;
    resource_type: string;
    created_at: Date | string;
    user: {
      email: string;
      role: string;
    };
  }[];
};