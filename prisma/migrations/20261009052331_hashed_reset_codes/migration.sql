/*
  Warnings:

  - You are about to drop the column `otp` on the `PasswordResetToken` table. All the data in the column will be lost.
  - Added the required column `code_hash` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PasswordResetToken" DROP COLUMN "otp",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "code_hash" TEXT NOT NULL;
