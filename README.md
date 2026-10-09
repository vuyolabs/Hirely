# Hirely

**Hire for skills, not keywords.** Hirely is a job platform that turns resumes into structured profiles, ranks roles by real skill overlap, and keeps candidates and recruiters on one transparent hiring pipeline.

Built with Next.js 16 (App Router), React 19, Prisma 7 on PostgreSQL, Tailwind CSS 4 and shadcn/ui.

## Features

### Candidates
- **Resume parsing**: upload a PDF and an LLM extracts skills, experience, education and projects into a structured profile.
- **Job recommendations**: roles are scored 0–100 on skill match, experience level, location and employment type.
- **Job search** with filters, saved jobs, and one-click applications.
- **Application tracking** through every stage (Applied → Screening → Shortlisted → Interview → Hired / Rejected).

### Recruiters
- **Company onboarding** with Indian business identifier validation (GSTIN etc.) and admin verification.
- **AI JD writer** that drafts job descriptions in a chosen tone (professional, friendly, startup) and length.
- **Job management**: create, edit and publish rich job postings.
- **Pipeline view** for reviewing applicants and moving them between stages, with full status history.

### Admins
- Dashboard with platform-wide stats.
- Company verification, job moderation, user management.
- Audit log of sensitive actions.

### Platform
- Email/password auth with JWT sessions (`jose`, HTTP-only cookie, 7-day expiry) and role-based route protection in `src/proxy.ts`.
- Password reset via emailed one-time code (hashed at rest).
- Light/dark theme.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Database | PostgreSQL, Prisma 7 (`@prisma/adapter-pg`) |
| UI | Tailwind CSS 4, shadcn/ui, Base UI, Lucide / Phosphor / Hugeicons |
| AI | Groq (OpenAI-compatible API) running `openai/gpt-oss-120b` |
| File storage | Supabase Storage (resumes) |
| PDF | `unpdf` |
| Email | Nodemailer (SMTP, Ethereal fallback in development) |
| Validation | Zod |

## Getting started

### Prerequisites
- Node.js 20+
- pnpm 11 (`corepack enable`)
- A PostgreSQL database
- A Supabase project with a storage bucket for resumes
- A [Groq](https://console.groq.com) API key

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hirely"

# Auth: long random string used to sign sessions and hash reset codes
SESSION_SECRET="generate-with: openssl rand -base64 32"

# Public base URL, used for links in emails (required in production)
APP_URL="http://localhost:3000"

# AI (resume parsing + JD writer)
GROQ_API_KEY=""

# Resume storage
SUPABASE_URL=""
SUPABASE_SECRET_KEY=""
SUPABASE_RESUME_BUCKET="resumes"   # optional, defaults to "resumes"

# Email (optional in development: falls back to Ethereal and logs a preview URL)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="\"Hirely\" <noreply@yourdomain.com>"
```

### 3. Set up the database

The Prisma client is generated into `src/generated/prisma` (gitignored), so generate it after install:

```bash
pnpm prisma migrate deploy   # apply migrations (use `migrate dev` while developing)
pnpm prisma generate
```

### 4. Create an admin and seed demo data (optional)

```bash
pnpm create-admin admin@example.com 'Str0ng!Passw0rd'
pnpm seed
```

`pnpm seed` creates demo companies, one recruiter per company, and 100 jobs. Re-running it is safe. Recruiter logins are written to `scripts/seed-output/recruiter-logins.csv`, which is gitignored. Don't commit it.

### 5. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm create-admin <email> <password>` | Create an admin, or promote an existing user to admin |
| `pnpm seed` | Seed demo companies, recruiters and jobs |

## Project structure

```
prisma/
  schema.prisma          # Data model: users, profiles, companies, jobs, applications, audit log
  migrations/
scripts/
  create-admin.mjs
  seed.mjs
src/
  actions/               # Server actions (auth, onboarding, candidate, recruiter, admin, JD writer)
  app/
    (auth)/              # Login, signup, forgot/reset password
    (root)/
      admin/             # Admin console
      candidate/         # Candidate dashboard, jobs, applications, profile
      recruiter/         # Recruiter dashboard, jobs, applicant pipeline
      onboarding/
    api/                 # Route handlers
    page.tsx             # Landing page
  components/            # Feature components + shadcn/ui primitives in ui/
  lib/
    ai/                  # Resume parser and JD writer (Groq)
    dal.ts               # Data access layer / session verification
    session.ts           # JWT session helpers
    recommendations.ts   # Job-candidate match scoring
    storage.ts           # Supabase resume storage
    mail.ts              # Transactional email
  proxy.ts               # Route protection by role
```

## User roles

| Role | Access |
| --- | --- |
| `CANDIDATE` | `/candidate/*`: profile, job search, applications |
| `RECRUITER` | `/recruiter/*`: company, jobs, applicant pipeline (after onboarding) |
| `ADMIN` | `/admin/*`: verification, moderation, users, audit log |

New users choose Candidate or Recruiter at signup and complete onboarding before reaching their dashboard. Admins are created only with `pnpm create-admin`.
