ALTER TABLE "Trader"
ADD COLUMN "licenseRegistrationType" TEXT,
ADD COLUMN "licenseRegistrationDate" TIMESTAMP(3),
ADD COLUMN "licenseExpiryDate" TIMESTAMP(3);
