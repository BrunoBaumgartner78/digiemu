import { prisma } from "@/lib/prisma";
import { marketplaceTenant } from "@/lib/marketplaceTenant";

async function main() {
  const mp = await marketplaceTenant();
  // change FROM_KEY to where your products currently are (e.g. 'mp-e2e' or 'DEFAULT')
  const FROM_KEY = process.env.FROM_TENANT_KEY || "DEFAULT";

  console.log(`Migrating tenantKey from '${FROM_KEY}' -> '${mp.key}'`);

  // counts before
  const [prodBefore, vpBefore] = await Promise.all([
    prisma.product.count({ where: { tenantKey: FROM_KEY } }),
    prisma.vendorProfile.count({ where: { tenantKey: FROM_KEY } }),
  ]);

  console.log(`Before: products=${prodBefore}, vendorProfiles=${vpBefore}`);

  const res = await prisma.$transaction(async (tx) => {
    const vp = await tx.vendorProfile.updateMany({ where: { tenantKey: FROM_KEY }, data: { tenantKey: mp.key } });
    const products = await tx.product.updateMany({ where: { tenantKey: FROM_KEY }, data: { tenantKey: mp.key } });
    return { vp, products };
  });

  const [prodAfter, vpAfter] = await Promise.all([
    prisma.product.count({ where: { tenantKey: mp.key } }),
    prisma.vendorProfile.count({ where: { tenantKey: mp.key } }),
  ]);

  console.log(`Updated vendorProfiles: ${res.vp.count}, products: ${res.products.count}`);
  console.log(`After: products=${prodAfter}, vendorProfiles=${vpAfter}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
