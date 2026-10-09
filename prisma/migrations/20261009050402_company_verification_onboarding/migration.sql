-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OPC', 'LLP', 'PARTNERSHIP', 'PROPRIETORSHIP', 'GOVERNMENT', 'NGO');

-- CreateEnum
CREATE TYPE "CompanyVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HiringFor" AS ENUM ('OWN_COMPANY', 'CLIENTS');

-- AlterTable
ALTER TABLE "RecruiterProfile" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "hiring_for" "HiringFor" NOT NULL DEFAULT 'OWN_COMPANY',
ADD COLUMN     "hiring_volume" TEXT,
ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "company_type" "CompanyType" NOT NULL,
    "industry" TEXT NOT NULL,
    "company_size" TEXT NOT NULL,
    "founded_year" INTEGER,
    "website" TEXT,
    "description" TEXT,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "registration_number" TEXT,
    "address_line" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "verification_status" "CompanyVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verification_note" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_gstin_key" ON "Company"("gstin");

-- AddForeignKey
ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
