-- Hotfix: map invalid legacy value APPROVED to ACTIVE
-- Safe to re-run (no-op if none exist)
UPDATE "public"."Product"
SET status = 'ACTIVE'
WHERE status::text = 'APPROVED';
