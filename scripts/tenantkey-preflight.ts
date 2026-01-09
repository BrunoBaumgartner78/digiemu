import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const DEFAULT_TENANT = process.env.DEFAULT_TENANT_KEY || "bellu";

  // 1) NULL counts (Prisma schema has tenantKey as non-nullable -> use SQL IS NULL)
  const [vpNull, pNull, oNull] = await Promise.all([
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint AS c FROM "VendorProfile" WHERE "tenantKey" IS NULL`,
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint AS c FROM "Product" WHERE "tenantKey" IS NULL`,
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint AS c FROM "Order" WHERE "tenantKey" IS NULL`,
  ]).then((rows) => [
    Number(rows[0]?.[0]?.c ?? 0),
    Number(rows[1]?.[0]?.c ?? 0),
    Number(rows[2]?.[0]?.c ?? 0),
  ]);

  console.log("NULL tenantKey counts:", {
    vendorProfile: vpNull,
    product: pNull,
    order: oNull,
  });

  // 2) Empty-string counts
  // (this is useful because Prisma schema uses non-nullable tenantKey, so empty strings
  // are the expected legacy artifact to fix)
  const [vpEmpty, pEmpty, oEmpty] = await Promise.all([
    prisma.vendorProfile.count({ where: { tenantKey: "" } }),
    prisma.product.count({ where: { tenantKey: "" } }),
    prisma.order.count({ where: { tenantKey: "" } }),
  ]);

  console.log("Empty-string tenantKey counts:", {
    vendorProfile: vpEmpty,
    product: pEmpty,
    order: oEmpty,
  });

  // 3) Duplicates (tenantKey, userId) — Prisma v6 having typings can be finicky
  // Use SQL for a stable preflight signal.
  const dupUserId = await prisma.$queryRaw<
    { tenantKey: string; userId: string; c: bigint }[]
  >`
    SELECT "tenantKey", "userId", COUNT(*)::bigint AS c
    FROM "VendorProfile"
    GROUP BY "tenantKey", "userId"
    HAVING COUNT(*) > 1
    ORDER BY c DESC
    LIMIT 200
  `;

  // 3) Duplicates (tenantKey, slug) — slug NOT NULL only (SQL)
  const dupSlug = await prisma.$queryRaw<
    { tenantKey: string; slug: string; c: bigint }[]
  >`
    SELECT "tenantKey", "slug", COUNT(*)::bigint AS c
    FROM "VendorProfile"
    WHERE "slug" IS NOT NULL AND "slug" <> ''
    GROUP BY "tenantKey", "slug"
    HAVING COUNT(*) > 1
    ORDER BY c DESC
    LIMIT 200
  `;

  console.log("DUP (tenantKey,userId):", dupUserId.length);
  if (dupUserId.length) console.log(dupUserId.slice(0, 20).map((r) => ({ ...r, c: Number(r.c) })));

  console.log("DUP (tenantKey,slug):", dupSlug.length);
  if (dupSlug.length) console.log(dupSlug.slice(0, 20).map((r) => ({ ...r, c: Number(r.c) })));

  // 4) Suspicious slugs sample (cheap heuristic)
  const suspicious = await prisma.vendorProfile.findMany({
    where: {
      OR: [
        { slug: { contains: " " } },
        { slug: { contains: "--" } },
        // uppercase check best-effort: fetch then check in JS
      ],
    },
    select: { id: true, tenantKey: true, userId: true, slug: true },
    take: 50,
  });

  const suspiciousUpper = suspicious.filter((x) => (x.slug ?? "") !== (x.slug ?? "").toLowerCase());
  const merged = [
    ...suspicious,
    ...suspiciousUpper.filter((x) => !suspicious.some((y) => y.id === x.id)),
  ].slice(0, 50);

  console.log("Suspicious slugs (max 50):", merged.length);
  if (merged.length) console.log(merged);

  // Exit codes
  // 0: OK (ready to enforce NOT NULL + uniques)
  // 2: NULL tenantKeys exist (run backfill first)
  // 3: duplicates exist or unexpected error
  if (vpNull + pNull + oNull > 0) process.exit(2);
  if (dupUserId.length > 0 || dupSlug.length > 0) process.exit(3);

  process.exit(0);
}

main()
  .catch((e) => {
    console.error("Preflight error:", e);
    process.exit(3);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
