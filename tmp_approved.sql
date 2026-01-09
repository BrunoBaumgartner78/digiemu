SELECT COUNT(*)::int AS approved_cnt
FROM "public"."Product"
WHERE status::text = 'APPROVED';
