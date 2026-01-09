import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { loadTenantsConfig } from "@/lib/tenants";


const prisma = new PrismaClient();

function normalizeSlug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function shortId(id: string) {
  return id.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
}

async function main() {

const cfg = loadTenantsConfig();
const tenantKey = Object.keys(cfg.tenants)[0]; // bellu

  console.log("[dedupe] tenantKey:", tenantKey);

  /* ------------------------------------------------------------------ */
  /* 0) Backfill empty-string tenantKey (safe, idempotent)
     Note: Prisma schema declares tenantKey as NOT NULL, so older
     databases that somehow contain real NULLs should be normalized
     via SQL before running this script. We optionally run raw SQL
     updates below to guard against that case. */
  /* ------------------------------------------------------------------ */

  // Optional SQL guard for legacy DBs that may still contain NULLs
  // in tenantKey columns. This is safe and idempotent.
  try {
    await prisma.$executeRawUnsafe(`UPDATE "VendorProfile" SET "tenantKey"='' WHERE "tenantKey" IS NULL;`);
    await prisma.$executeRawUnsafe(`UPDATE "Product" SET "tenantKey"='' WHERE "tenantKey" IS NULL;`);
    await prisma.$executeRawUnsafe(`UPDATE "Order" SET "tenantKey"='' WHERE "tenantKey" IS NULL;`);
  } catch (e) {
    // ignore - some DBs/users may not allow raw execution in the environment
  }

  const [vp, pr, or] = await Promise.all([
    prisma.vendorProfile.updateMany({
      // tenantKey is NOT nullable in Prisma schema -> use empty-string instead of null
      where: { tenantKey: "" },
      data: { tenantKey },
    }),
    prisma.product.updateMany({
      // tenantKey is NOT nullable in Prisma schema -> use empty-string instead of null
      where: { tenantKey: "" },
      data: { tenantKey },
    }),
    prisma.order.updateMany({
      // tenantKey is NOT nullable in Prisma schema -> use empty-string instead of null
      where: { tenantKey: "" },
      data: { tenantKey },
    }),
  ]);

  console.log("[dedupe] backfill:", {
    vendorProfiles: vp.count,
    products: pr.count,
    orders: or.count,
  });

  /* ------------------------------------------------------------------ */
  /* 1) Normalize slugs (non-destructive)                                */
  /* ------------------------------------------------------------------ */
  const withSlugs = await prisma.vendorProfile.findMany({
    where: { tenantKey, slug: { not: null } },
    select: { id: true, slug: true },
  });

  let normalizedCount = 0;
  for (const vp of withSlugs) {
    const raw = vp.slug ?? "";
    const norm = normalizeSlug(raw);
    if (!norm || norm === raw) continue;

    await prisma.vendorProfile.update({
      where: { id: vp.id },
      data: { slug: norm },
    });
    normalizedCount++;
  }

  console.log("[dedupe] normalized slugs:", normalizedCount);

  /* ------------------------------------------------------------------ */
  /* 2) Duplicates (tenantKey, userId) – REPORT ONLY                     */
  /* ------------------------------------------------------------------ */
  const dupUser = await prisma.vendorProfile.groupBy({
    by: ["tenantKey", "userId"],
    where: { tenantKey },
    _count: { _all: true },
    having: {
      userId: {
        _count: { gt: 1 },
      },
    },
  });

  if (dupUser.length === 0) {
    console.log("[dedupe] duplicates (tenantKey,userId): 0");
  } else {
    console.warn(
      "[dedupe] duplicates (tenantKey,userId):",
      dupUser.length
    );
    console.warn(dupUser.slice(0, 25));
  }

  /* ------------------------------------------------------------------ */
  /* 3) Dedupe (tenantKey, slug) – keep newest, mutate others            */
  /* ------------------------------------------------------------------ */
  const dupSlug = await prisma.vendorProfile.groupBy({
    by: ["tenantKey", "slug"],
    where: {
      tenantKey,
      slug: { not: null },
    },
    _count: { _all: true },
    having: {
      slug: {
        _count: { gt: 1 },
      },
    },
  });

  console.log("[dedupe] duplicates (tenantKey,slug):", dupSlug.length);

  for (const g of dupSlug) {
    const slug = g.slug as string;

    const rows = await prisma.vendorProfile.findMany({
      where: { tenantKey: g.tenantKey, slug },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });

    const keep = rows[0];
    const losers = rows.slice(1);

    for (const l of losers) {
      const newSlug = `${slug}-${shortId(l.id)}`;
      await prisma.vendorProfile.update({
        where: { id: l.id },
        data: { slug: newSlug },
      });
    }

    if (losers.length > 0) {
      console.log(
        "[dedupe] slug:",
        slug,
        "kept:",
        keep.id,
        "mutated:",
        losers.length
      );
    }
  }

  console.log("[dedupe] done ✅");
}

main()
  .catch((e) => {
    console.error("[dedupe] error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
