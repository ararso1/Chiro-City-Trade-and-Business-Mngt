/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `License` table. All the data in the column will be lost.
  - You are about to drop the column `issuedAt` on the `License` table. All the data in the column will be lost.
  - You are about to drop the column `issuedBy` on the `License` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `License` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseNo]` on the table `License` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `licenseNo` to the `License` table without a default value. This is not possible if the table is not empty.
  - Added the required column `traderId` to the `License` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "License_licenseNumber_key";

-- AlterTable
ALTER TABLE "License" DROP COLUMN "expiresAt",
DROP COLUMN "issuedAt",
DROP COLUMN "issuedBy",
DROP COLUMN "licenseNumber",
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "issueDate" TIMESTAMP(3),
ADD COLUMN     "issuedById" TEXT,
ADD COLUMN     "licenseNo" TEXT NOT NULL,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "traderId" TEXT NOT NULL,
ALTER COLUMN "licenseType" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'application';

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseNo_key" ON "License"("licenseNo");

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
