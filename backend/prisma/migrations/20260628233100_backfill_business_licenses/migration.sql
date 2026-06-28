-- Keep exactly one license per business before adding the uniqueness constraint.
DELETE FROM "License"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (PARTITION BY "businessId" ORDER BY "createdAt" ASC, "id" ASC) AS rn
    FROM "License"
  ) ranked
  WHERE ranked.rn > 1
);

-- Backfill a generated license for every existing business that does not have one.
INSERT INTO "License" (
  "id",
  "licenseNo",
  "traderId",
  "businessId",
  "licenseType",
  "issueDate",
  "expiryDate",
  "status",
  "renewalReminderSent",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('lic_', md5(b."id")),
  concat('LIC-', upper(substr(md5(b."id"), 1, 12))),
  b."traderId",
  b."id",
  COALESCE(NULLIF(b."type", ''), NULLIF(b."category", ''), 'Annual Trading'),
  COALESCE(b."startDate", b."createdAt"),
  COALESCE(b."startDate", b."createdAt") + interval '1 year',
  CASE
    WHEN COALESCE(b."startDate", b."createdAt") + interval '1 year' < CURRENT_DATE THEN 'Expired'
    WHEN COALESCE(b."startDate", b."createdAt") + interval '1 year' <= CURRENT_DATE + interval '30 days' THEN 'Expiring Soon'
    ELSE 'Active'
  END,
  false,
  now(),
  now()
FROM "Business" b
WHERE NOT EXISTS (
  SELECT 1
  FROM "License" l
  WHERE l."businessId" = b."id"
);

ALTER TABLE "License" ALTER COLUMN "status" SET DEFAULT 'Active';

CREATE UNIQUE INDEX "License_businessId_key" ON "License"("businessId");
