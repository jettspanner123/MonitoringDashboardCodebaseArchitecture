-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('PRODUCTION', 'QA', 'TESTING', 'TRAINING', 'DEV1', 'DEV2');

-- AlterTable
ALTER TABLE "MD_PageLoadCheckTBL" ADD COLUMN     "technicalReason" TEXT;

-- AlterTable
ALTER TABLE "MD_TestRunTBL" ADD COLUMN     "environment" "Environment";
