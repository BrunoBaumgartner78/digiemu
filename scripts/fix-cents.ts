import { prisma } from "../src/lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    where: { priceCents: { gt: 0, lt: 50 } },
    select: { id: true, title: true, priceCents: true },
  });

  const orders = await prisma.order.findMany({
    where: { amountCents: { gt: 0, lt: 50 } },
    select: { id: true, stripeSessionId: true, amountCents: true, productId: true },
  });

  console.log(`Products to fix: ${products.length}`);
  for (const p of products) {
    const newVal = p.priceCents * 100;
    await prisma.product.update({ where: { id: p.id }, data: { priceCents: newVal } });
    console.log(`✅ product ${p.id} "${p.title}" ${p.priceCents} -> ${newVal}`);
  }

  console.log(`Orders to fix: ${orders.length}`);
  for (const o of orders) {
    const newVal = o.amountCents * 100;
    await prisma.order.update({ where: { id: o.id }, data: { amountCents: newVal } });
    console.log(`✅ order ${o.id} ${o.amountCents} -> ${newVal}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
