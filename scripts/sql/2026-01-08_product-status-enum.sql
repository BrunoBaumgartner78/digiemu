-- Create enum + convert Product.status to enum
-- SAFE: maps legacy strings and sets default

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
    CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT','ACTIVE','BLOCKED','PUBLISHED');
  END IF;
END$$;

ALTER TABLE "public"."Product" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "public"."Product"
ALTER COLUMN "status" TYPE "public"."ProductStatus"
USING (
  CASE
    WHEN "status" IS NULL THEN 'DRAFT'::"public"."ProductStatus"
    WHEN UPPER("status") IN ('DRAFT') THEN 'DRAFT'::"public"."ProductStatus"
    WHEN UPPER("status") IN ('ACTIVE','APPROVED') THEN 'ACTIVE'::"public"."ProductStatus"
    WHEN UPPER("status") IN ('BLOCKED','DISABLED') THEN 'BLOCKED'::"public"."ProductStatus"
    WHEN UPPER("status") IN ('PUBLISHED','LIVE') THEN 'PUBLISHED'::"public"."ProductStatus"
    ELSE 'DRAFT'::"public"."ProductStatus"
  END
);

ALTER TABLE "public"."Product"
ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."ProductStatus";
