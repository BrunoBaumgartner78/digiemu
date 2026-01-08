SELECT status::text AS status, COUNT(*)::int AS cnt
FROM "public"."Product"
GROUP BY status::text
ORDER BY status::text;
