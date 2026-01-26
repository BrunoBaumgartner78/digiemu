import { prisma } from "../src/lib/prisma";

async function main() {
  const orders = await prisma.order.findMany({
    where: { amountCents: { lt: 50 } },
    include: { product: { select: { priceCents: true } } },
  });

  let fixed = 0;
  for (const o of orders) {
    const priceCents = o.product?.priceCents ?? 0;
    if (priceCents >= 50) {
      await prisma.order.update({
        where: { id: o.id },
        data: { amountCents: priceCents },
      });
      fixed++;
    }
  }

  console.log(`Fixed orders: ${fixed}/${orders.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
