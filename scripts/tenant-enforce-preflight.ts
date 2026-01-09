import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Count empty-string (schema says non-nullable, so empty string is the common legacy artifact)
  const [vpEmpty, pEmpty, oEmpty, dlEmpty, payEmpty] = await Promise.all([
    prisma.vendorProfile.count({ where: { tenantKey: "" } }),
    prisma.product.count({ where: { tenantKey: "" } }),
    prisma.order.count({ where: { tenantKey: "" } }),
    prisma.downloadLink.count({ where: { tenantKey: "" } }),
    prisma.payout.count({ where: { tenantKey: "" } }),
  ]);

  const emptyTotal = vpEmpty + pEmpty + oEmpty + dlEmpty + payEmpty;

  console.log("Empty-string tenantKey counts:", {
    vendorProfile: vpEmpty,
    product: pEmpty,
    order: oEmpty,
    downloadLink: dlEmpty,
    payout: payEmpty,
  });

  if (emptyTotal > 0) {
    console.error("❌ Preflight failed: empty tenantKey rows exist. Run backfill first.");
    process.exit(2);
  }

  console.log("✅ Preflight OK: no empty tenantKey rows.");
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
