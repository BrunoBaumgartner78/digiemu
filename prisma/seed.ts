import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) DEFAULT Tenant
  const tenant = await prisma.tenant.upsert({
    where: { key: "DEFAULT" },
    update: { name: "DigiEmu Default" },
    create: { key: "DEFAULT", name: "DigiEmu Default", status: "ACTIVE", plan: "FREE" },
  });

  // 2) Domains (optional – passe an)
  const domains = [
    "localhost:3000",
    "digiemu.ch",
    "www.digiemu.ch",
  ];

  for (const d of domains) {
    await prisma.tenantDomain.upsert({
      where: { domain: d },
      update: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        domain: d,
        isPrimary: d === "digiemu.ch",
      },
    });
  }

  console.log("✅ Seeded DEFAULT tenant + domains");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
