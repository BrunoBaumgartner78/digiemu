import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Running direct backfill: vendorProfile.status NULL -> PENDING');
  // Count NULLs using raw SQL since Prisma enum filters disallow `null` in some clients.
  const beforeRes = await prisma.$queryRaw`SELECT count(*)::int as c FROM "VendorProfile" WHERE status IS NULL`;
  const before = beforeRes?.[0]?.c ?? 0;
  console.log('NULL before:', before);

  const exec = await prisma.$executeRaw`UPDATE "VendorProfile" SET status = 'PENDING' WHERE status IS NULL`;
  console.log('Updated (rows):', exec);

  const afterRes = await prisma.$queryRaw`SELECT count(*)::int as c FROM "VendorProfile" WHERE status IS NULL`;
  const after = afterRes?.[0]?.c ?? 0;
  console.log('NULL after:', after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
