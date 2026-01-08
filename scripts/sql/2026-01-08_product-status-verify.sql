-- Verify Product.status column type and values
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='Product' AND column_name='status';

SELECT status, COUNT(*) as cnt
FROM "public"."Product"
GROUP BY status
ORDER BY status;
