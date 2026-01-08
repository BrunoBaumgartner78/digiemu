DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ProductStatus'
      AND e.enumlabel = 'ARCHIVED'
  ) THEN
    ALTER TYPE "public"."ProductStatus" ADD VALUE 'ARCHIVED';
  END IF;
END $$;
