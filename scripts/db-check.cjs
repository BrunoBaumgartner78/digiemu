// scripts/db-check.cjs
// CommonJS variant for environments where package.json sets "type": "module".
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.warn('dotenv not available (ok if env already set).', e?.message);
}

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL set?', !!url);
  if (url) console.log('DATABASE_URL preview:', String(url).slice(0, 60) + '...');

  const count = await prisma.order.count();
  console.log('order.count =', count);

  const rows = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, title: true, priceCents: true } } },
  });

  console.log(
    rows.map((r) => ({
      id: r.id,
      status: r.status,
      amountCents: r.amountCents,
      productPriceCents: r.product?.priceCents ?? null,
      title: r.product?.title ?? null,
      createdAt: r.createdAt,
    }))
  );
})()
  .catch((e) => {
    console.error('DB CHECK ERROR:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
