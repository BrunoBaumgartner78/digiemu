/* scripts/vendorprofile-backfill.ts
 *
 * Backfills Product.vendorProfileId for products that are missing it,
 * using VendorProfile compound-unique (tenantKey, userId).
 *
 * ✅ Prisma-safe (vendorProfileId is nullable so `equals: null` is allowed)
 * ✅ Tenant-aware (defaults to DEFAULT)
 */
import { prisma } from "@/lib/prisma";

const DEFAULT_TENANT = (process.env.DEFAULT_TENANT_KEY ?? "DEFAULT").trim() || "DEFAULT";
const BATCH_SIZE = Number(process.env.BACKFILL_BATCH_SIZE ?? 500);

function keyOf(tenantKey: string, userId: string) {
  return `${tenantKey}::${userId}`;
}

async function main() {
  const onlyTenant = (process.env.TENANT_KEY ?? "").trim(); // optional: restrict to a tenant
  const tenantKeyForNullish = DEFAULT_TENANT;

  // OPTIONAL safety: If DB contains NULL vendorProfileId values (shouldn't with current schema),
  // normalize them to empty-string so Prisma can work with it safely. Comment out if not needed.
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "vendorProfileId" = ''
    WHERE "vendorProfileId" IS NULL
  `;

  // 1) Load products that miss vendorProfileId (and have vendorId)
  const products = await prisma.product.findMany({
    where: {
      ...(onlyTenant ? { tenantKey: onlyTenant } : {}),
      vendorId: { not: "" },
      // Prisma schema: vendorProfileId is non-nullable (String) → no null checks allowed.
      // Legacy broken rows are typically empty string.
      OR: [{ vendorProfileId: "" }],
    },
    select: { id: true, tenantKey: true, vendorId: true, vendorProfileId: true },
    take: 50_000,
    orderBy: { createdAt: "asc" },
  });

  const totalChecked = products.length;
  if (totalChecked === 0) {
    console.log(JSON.stringify({ ok: true, updatedCount: 0, skippedNoProfile: 0, totalChecked: 0 }));
    return;
  }

  // 2) Collect unique (tenantKey, vendorId) pairs
  const pairs = new Map<string, { tenantKey: string; userId: string }>();
  for (const p of products) {
    const tk = (p.tenantKey ?? tenantKeyForNullish).trim() || tenantKeyForNullish;
    const uid = String(p.vendorId ?? "").trim();
    if (!uid) continue;
    pairs.set(keyOf(tk, uid), { tenantKey: tk, userId: uid });
  }

  const pairList = Array.from(pairs.values());

  // 3) Fetch matching vendorProfiles in chunks
  const vpMap = new Map<string, string>(); // key -> vendorProfileId

  for (let i = 0; i < pairList.length; i += BATCH_SIZE) {
    const chunk = pairList.slice(i, i + BATCH_SIZE);

    const vendorProfiles = await prisma.vendorProfile.findMany({
      where: {
        OR: chunk.map((c) => ({ tenantKey: c.tenantKey, userId: c.userId })),
      },
      select: { id: true, tenantKey: true, userId: true, status: true },
    });

    for (const vp of vendorProfiles) {
      vpMap.set(keyOf(vp.tenantKey, vp.userId), vp.id);
    }
  }

  // 4) Update products
  let updatedCount = 0;
  let skippedNoProfile = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);

    const ops: any[] = [];
    for (const p of chunk) {
      const tk = (p.tenantKey ?? tenantKeyForNullish).trim() || tenantKeyForNullish;
      const uid = String(p.vendorId ?? "").trim();
      const vpId = vpMap.get(keyOf(tk, uid));

      if (!vpId) {
        skippedNoProfile += 1;
        continue;
      }

      ops.push(
        prisma.product.update({
          where: { id: p.id },
          data: { vendorProfileId: vpId },
          select: { id: true },
        })
      );
    }

    if (ops.length > 0) {
      const res = await prisma.$transaction(ops);
      updatedCount += res.length;
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      tenantKey: onlyTenant || undefined,
      updatedCount,
      skippedNoProfile,
      totalChecked,
    })
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
