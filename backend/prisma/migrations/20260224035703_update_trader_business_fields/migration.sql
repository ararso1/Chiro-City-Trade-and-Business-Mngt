/*
  Warnings:

  - You are about to drop the column `idNumber` on the `Trader` table. All the data in the column will be lost.
  - You are about to drop the column `idType` on the `Trader` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "shopNo" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "type" TEXT,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trader" DROP COLUMN "idNumber",
DROP COLUMN "idType",
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "nationalId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AddForeignKey
ALTER TABLE "Trader" ADD CONSTRAINT "Trader_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trader" ADD CONSTRAINT "Trader_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
