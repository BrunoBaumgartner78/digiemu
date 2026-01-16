-- 1) CLEANUP: entferne doppelte PENDING-Payouts pro vendorId (behält den neuesten)
WITH ranked AS (
  SELECT
    id,
    "vendorId",
    "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY "vendorId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS rn
  FROM "Payout"
  WHERE "status" = 'PENDING'
)
DELETE FROM "Payout" p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- 2) RACE-PROOF: nur 1x PENDING pro vendorId zulassen
CREATE UNIQUE INDEX IF NOT EXISTS "Payout_vendorId_pending_unique"
ON "Payout" ("vendorId")
WHERE "status" = 'PENDING';
-- Ensure only one PENDING payout per vendor at any time
CREATE UNIQUE INDEX IF NOT EXISTS "Payout_vendorId_pending_unique"
ON "Payout" ("vendorId")
WHERE "status" = 'PENDING';
