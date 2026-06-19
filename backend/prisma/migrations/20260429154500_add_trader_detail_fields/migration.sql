-- Align the Trader table with the current trader registration/import fields.
-- TIN remains required by the API for new traders, but nullable in the DB so existing rows can be preserved.
ALTER TABLE "Trader"
ADD COLUMN "tin" TEXT,
ADD COLUMN "typeOfJob" TEXT,
ADD COLUMN "plateNumber" TEXT,
ADD COLUMN "associationType" TEXT,
ADD COLUMN "businessArea" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "licenseTrackYear" INTEGER,
ADD COLUMN "licenseNewThisYear" INTEGER,
ADD COLUMN "licenseExpiredCount" INTEGER,
ADD COLUMN "licenseClosedCount" INTEGER,
ADD COLUMN "licenseRenewedCount" INTEGER,
ADD COLUMN "licenseActiveCount" INTEGER,
ADD COLUMN "licenseRenewalDueCount" INTEGER,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "Trader_phone_key" ON "Trader"("phone");
CREATE UNIQUE INDEX "Trader_tin_key" ON "Trader"("tin");
