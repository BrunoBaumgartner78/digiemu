#!/usr/bin/env node
import { execSync } from "child_process";

function run(name, sql) {
  console.log(`\n--- ${name} ---\n`);
  try {
    const out = execSync("npx prisma db execute --stdin", { input: sql, encoding: "utf8" });
    console.log(out);
  } catch (e) {
    console.error("Query failed:", e.message || e);
    if (e.stdout) console.log(String(e.stdout));
    process.exitCode = 2;
  }
}

const q1 = `SELECT
  (SELECT COUNT(*) FROM "VendorProfile" WHERE "tenantKey" IS NULL) AS vendorprofile_nulls,
  (SELECT COUNT(*) FROM "Product"       WHERE "tenantKey" IS NULL) AS product_nulls,
  (SELECT COUNT(*) FROM "Order"         WHERE "tenantKey" IS NULL) AS order_nulls;`;

const q2 = `SELECT "tenantKey", "userId", COUNT(*) AS cnt
FROM "VendorProfile"
WHERE "tenantKey" IS NOT NULL
GROUP BY "tenantKey", "userId"
HAVING COUNT(*) > 1
ORDER BY cnt DESC, "tenantKey", "userId";`;

const q3 = `SELECT "tenantKey", "slug", COUNT(*) AS cnt
FROM "VendorProfile"
WHERE "tenantKey" IS NOT NULL
  AND "slug" IS NOT NULL
  AND TRIM("slug") <> ''
GROUP BY "tenantKey", "slug"
HAVING COUNT(*) > 1
ORDER BY cnt DESC, "tenantKey", "slug";`;

const q4 = `SELECT "id", "tenantKey", "slug"
FROM "VendorProfile"
WHERE "slug" IS NOT NULL
  AND (
    "slug" <> TRIM("slug")
    OR "slug" ~ '[A-Z]'
    OR "slug" LIKE '%--%'
  )
ORDER BY "tenantKey", "slug"
LIMIT 50;`;

run('Check for NULL tenantKey (VendorProfile/Product/Order)', q1);
run('Duplicate check: VendorProfile (tenantKey, userId)', q2);
run('Duplicate check: VendorProfile (tenantKey, slug) (ignore NULL slug)', q3);
run('Slug hygiene: suspicious slugs (leading/trailing spaces, uppercase, double dashes)', q4);

console.log('\nDone.');
