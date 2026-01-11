import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { key: "DEFAULT" },
    update: {},
    create: {
      key: "DEFAULT",
      mode: "MARKETPLACE",
      name: "DigiEmu Marketplace",
    } as any,
  });

  console.log("✅ Seeded DEFAULT tenant:", tenant.key, tenant.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
