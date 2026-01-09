import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { loadTenantsConfig } from "@/lib/tenants";

const prisma = new PrismaClient();

async function main() {


const cfg = loadTenantsConfig();
const tenantKey = Object.keys(cfg.tenants)[0]; // bellu

  const [vp, p, o] = await Promise.all([
    prisma.vendorProfile.updateMany({
      // tenantKey is non-nullable in schema; fix invalid empty-string values
      where: { tenantKey: "" },
      data: { tenantKey },
    }),
    prisma.product.updateMany({
      // tenantKey is non-nullable in schema; fix invalid empty-string values
      where: { tenantKey: "" },
      data: { tenantKey },
    }),
    prisma.order.updateMany({
      // tenantKey is non-nullable in schema; fix invalid empty-string values
      where: { tenantKey: "" },
      data: { tenantKey },
    }),
  ]);

  console.log("Backfill done:", {
    tenantKey,
    vendorProfilesUpdated: vp.count,
    productsUpdated: p.count,
    ordersUpdated: o.count,
  });
}

main()
  .catch((e) => {
    console.error("Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
