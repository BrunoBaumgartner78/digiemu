SELECT status::text AS status, COUNT(*)::int AS cnt
FROM "public"."Product"
GROUP BY 1
ORDER BY 1;

SELECT COUNT(*)::int AS approved_cnt
FROM "public"."Product"
WHERE status::text = 'APPROVED';
