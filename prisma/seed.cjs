// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // Demo-Daten aufräumen
  await prisma.product.deleteMany({});
  await prisma.vendorProfile.deleteMany({
    where: { displayName: "Demo Vendor" },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["admin@digiemu.test", "vendor@digiemu.test"],
      },
    },
  });

  // Admin mit KLARTEXT-Passwort (für lokalen Login)
  const admin = await prisma.user.create({
    data: {
      email: "admin@digiemu.test",
      password: "demo1234",
      role: "ADMIN",
      name: "Demo Admin",
    },
  });

  // Vendor mit KLARTEXT-Passwort
  const vendor = await prisma.user.create({
    data: {
      email: "vendor@digiemu.test",
      password: "demo1234",
      role: "VENDOR",
      name: "Demo Vendor User",
    },
  });

  const vendorProfile = await prisma.vendorProfile.create({
    data: {
      userId: vendor.id,
      displayName: "Demo Vendor",
      bio: "Dies ist ein Demo-Verkäufer für Testdaten.",
    },
  });

  await prisma.product.create({
    data: {
      title: "Demo Produkt 1",
      description: "Dies ist ein Demo-Produkt für DigiEmu.",
      priceCents: 990,
      fileUrl: "https://example.com/demo-product-1.pdf",
      thumbnail: "",
      category: "Demo",
      vendorId: vendor.id,
      vendorProfileId: vendorProfile.id,
      isActive: true,
    },
  });

  console.log("Admin:", admin.email);
  console.log("Vendor:", vendor.email);
  console.log("Demo product created.");
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
