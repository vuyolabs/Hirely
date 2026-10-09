-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "application_deadline" TIMESTAMP(3),
ADD COLUMN     "benefits" JSONB,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "locations" JSONB,
ADD COLUMN     "max_experience" INTEGER,
ADD COLUMN     "min_experience" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nice_to_have_skills" JSONB,
ADD COLUMN     "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "salary_disclosed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "salary_max" DOUBLE PRECISION,
ADD COLUMN     "salary_min" DOUBLE PRECISION,
ADD COLUMN     "work_mode" "WorkMode" NOT NULL DEFAULT 'ONSITE';
