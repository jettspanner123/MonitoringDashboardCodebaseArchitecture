/*
  Warnings:

  - You are about to drop the column `encryptedPassword` on the `MD_AuthenticationLoginCheckTBL` table. All the data in the column will be lost.
  - Added the required column `password` to the `MD_AuthenticationLoginCheckTBL` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MD_AuthenticationLoginCheckTBL" DROP COLUMN "encryptedPassword",
ADD COLUMN     "password" TEXT NOT NULL;
