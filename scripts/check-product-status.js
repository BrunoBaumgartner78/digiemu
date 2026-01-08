const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw`SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Product' AND column_name='status'`;
  console.log('Column info:', cols);

  const rows = await prisma.$queryRaw`SELECT status, COUNT(*) as cnt FROM "public"."Product" GROUP BY status ORDER BY status`; 
  console.log('Status counts:');
  console.table(rows);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
