// scripts/check-marketplace.js
const { PrismaClient } = require("@prisma/client");

const p = new PrismaClient();

(async () => {
  // 1) Counts nach Status
  const byStatus = await p.product.groupBy({
    by: ["status"],
    _count: { _all: true },
    orderBy: { status: "asc" },
  });

  // 2) Counts nach tenantKey
  const byTenant = await p.product.groupBy({
    by: ["tenantKey"],
    _count: { _all: true },
    orderBy: { tenantKey: "asc" },
  });

  // 3) “sichtbar” nach eurer Logik (ACTIVE + Vendor APPROVED + public)
  // Achtung: field names exakt wie im Prisma schema: vendorProfileId / vendorProfile relation
  const visibleCnt = await p.product.count({
    where: {
      status: "ACTIVE",
      vendorProfile: {
        is: {
          isPublic: true,
          status: "APPROVED", // VendorStatus enum
        },
      },
    },
  });

  console.log("DATABASE_URL host:", (() => {
    try { return new URL(process.env.DATABASE_URL).host; } catch { return "(invalid)"; }
  })());

  console.log("\nProducts by status:");
  console.table(byStatus.map(r => ({ status: r.status, cnt: r._count._all })));

  console.log("\nProducts by tenantKey:");
  console.table(byTenant.map(r => ({ tenantKey: r.tenantKey, cnt: r._count._all })));

  console.log("\nVisible products (ACTIVE + vendor APPROVED+public):", visibleCnt);

  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
