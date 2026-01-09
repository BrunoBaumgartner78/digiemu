import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw< { mode: string; c: bigint }[] >
    `SELECT "mode"::text AS mode, COUNT(*)::bigint AS c FROM "Tenant" GROUP BY 1 ORDER BY 2 DESC`;

  console.log("Tenant.mode counts:", rows.map(r => ({ mode: r.mode, c: Number(r.c) })));

  const bad = rows.filter(r => !["WHITE_LABEL", "MARKETPLACE"].includes(r.mode));
  if (bad.length) {
    console.error("❌ Found legacy Tenant.mode values:", bad);
    process.exit(2);
  }
  process.exit(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(3);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
