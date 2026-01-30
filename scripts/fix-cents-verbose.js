// scripts/fix-cents-verbose.js
// Repairs suspicious cents values (like 1 instead of 100) with verbose logging.
// Strategy:
// - Products: if priceCents > 0 && priceCents < THRESHOLD => multiply by 100
// - Orders:   if amountCents > 0 && amountCents < THRESHOLD => multiply by 100

try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  console.warn("dotenv not available (ok if env already set).", e?.message);
}

const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

const THRESHOLD = 50; // cents

(async () => {
  console.log("DATABASE_URL set?", !!process.env.DATABASE_URL);

  // ---- Products
  const badProducts = await prisma.product.findMany({
    where: { priceCents: { gt: 0, lt: THRESHOLD } },
    select: { id: true, title: true, priceCents: true },
  });

  console.log("Bad products:", badProducts.length);
  for (const p of badProducts) {
    const newVal = p.priceCents * 100;
    console.log("FIX product", p.id, `"${p.title}"`, p.priceCents, "->", newVal);
    await prisma.product.update({ where: { id: p.id }, data: { priceCents: newVal } });
  }

  // ---- Orders
  const badOrders = await prisma.order.findMany({
    where: { amountCents: { gt: 0, lt: THRESHOLD } },
    select: { id: true, amountCents: true, stripeSessionId: true, createdAt: true, productId: true },
  });

  console.log("Bad orders:", badOrders.length);
  for (const o of badOrders) {
    const newVal = o.amountCents * 100;
    console.log("FIX order", o.id, o.amountCents, "->", newVal, "productId=", o.productId);
    await prisma.order.update({ where: { id: o.id }, data: { amountCents: newVal } });
  }

  console.log("DONE.");
})()
  .catch((e) => {
    console.error("FIX ERROR:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
