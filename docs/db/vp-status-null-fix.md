# VendorProfile.status NULL Fix

## 1) Backfill (run once)
Option A (script):
- `npx tsx scripts/backfill-vendorprofile-status.ts`

Option B (SQL):
```sql
UPDATE "VendorProfile"
SET "status" = 'PENDING'
WHERE "status" IS NULL;
```

## 2) Enforce in DB (migration)
- `npx prisma migrate dev --name vendorprofile-status-not-null`
- `npx prisma generate`

## 3) Verify
```sql
SELECT COUNT(*) FROM "VendorProfile" WHERE "status" IS NULL;
```

## 4) Marketplace check
Hard refresh `/marketplace` and confirm vpStatus is not NULL.
