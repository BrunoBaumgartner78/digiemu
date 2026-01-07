import { prisma } from "../src/lib/prisma";

/**
 * SAFE DEFAULT BACKFILL:
 * Existing data is assumed to belong to digiemu (default tenant).
 * If you have multiple tenants already in the same DB, we can refine this later.
 */
async function main() {
  const tenantKey = process.env.BACKFILL_TENANT_KEY ?? "digiemu";

  // Try best-effort update via Prisma updateMany (if possible)
  try {
    const vp = await prisma.vendorProfile.updateMany({
      where: { tenantKey: null as any },
      data: { tenantKey },
    });
    console.log("vendorProfile updateMany:", vp);
  } catch (e) {
    console.warn("vendorProfile updateMany failed (maybe no nulls or unsupported).", e);
  }

  // Raw SQL fallback for null tenantKey columns
  try {
    await prisma.$executeRawUnsafe(`UPDATE "VendorProfile" SET "tenantKey" = $1 WHERE "tenantKey" IS NULL`, tenantKey);
    await prisma.$executeRawUnsafe(`UPDATE "Product" SET "tenantKey" = $1 WHERE "tenantKey" IS NULL`, tenantKey);
    await prisma.$executeRawUnsafe(`UPDATE "Order" SET "tenantKey" = $1 WHERE "tenantKey" IS NULL`, tenantKey);
    console.log("✅ Backfill done for tenantKey =", tenantKey);
  } catch (e) {
    console.error("Raw SQL backfill failed:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
