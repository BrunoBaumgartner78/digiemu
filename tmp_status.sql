SELECT status::text AS status, COUNT(*)::int AS cnt
FROM "public"."Product"
GROUP BY 1
ORDER BY 1;
