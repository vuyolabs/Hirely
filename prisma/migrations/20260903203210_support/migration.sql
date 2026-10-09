/*
  Warnings:

  - The values [ACTIVE] on the enum `ResumeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `file_url` on the `Resume` table. All the data in the column will be lost.
  - Added the required column `file_size` to the `Resume` table without a default value. This is not possible if the table is not empty.
  - Added the required column `object_key` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResumeStatus_new" AS ENUM ('UPLOADED', 'PROCESSING', 'PARSED', 'FAILED', 'ARCHIVED');
ALTER TABLE "public"."Resume" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Resume" ALTER COLUMN "status" TYPE "ResumeStatus_new" USING ("status"::text::"ResumeStatus_new");
ALTER TYPE "ResumeStatus" RENAME TO "ResumeStatus_old";
ALTER TYPE "ResumeStatus_new" RENAME TO "ResumeStatus";
DROP TYPE "public"."ResumeStatus_old";
ALTER TABLE "Resume" ALTER COLUMN "status" SET DEFAULT 'UPLOADED';
COMMIT;

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "file_url",
ADD COLUMN     "file_size" INTEGER NOT NULL,
ADD COLUMN     "object_key" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'UPLOADED';
