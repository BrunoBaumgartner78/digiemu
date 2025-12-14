// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // 0) Helper: löscht nur, wenn Model existiert (verhindert Crash, falls Name anders ist)
  const safeDeleteMany = async (modelName, args = {}) => {
    const model = prisma[modelName];
    if (!model || typeof model.deleteMany !== "function") {
      console.log(`(skip) prisma.${modelName}.deleteMany - model not found`);
      return;
    }
    await model.deleteMany(args);
    console.log(`(ok) cleared ${modelName}`);
  };

  // 1) ZUERST: Kind-Tabellen löschen (FK-Abhängigkeiten)
  //    Passe/ergänze die Liste bei Bedarf – Reihenfolge ist wichtig: Kinder → Eltern
  await safeDeleteMany("productView");         // z.B. ProductView
  await safeDeleteMany("productLike");         // z.B. ProductLike / Like
  await safeDeleteMany("like");                // falls Modell "Like" heißt
  await safeDeleteMany("review");              // Reviews
  await safeDeleteMany("comment");             // Kommentare
  await safeDeleteMany("downloadLink");        // DownloadLinks
  await safeDeleteMany("download");            // falls vorhanden
  await safeDeleteMany("orderItem");           // OrderItems (wenn Order -> Items)
  await safeDeleteMany("order");               // Orders (wenn OrderItem vorher weg ist)

  // 2) Danach: Produkte löschen
  await safeDeleteMany("product");

  // 3) Demo VendorProfile löschen (und ggf. weitere Tabellen, die VendorProfile referenzieren)
  await safeDeleteMany("vendorProfile", { where: { displayName: "Demo Vendor" } });

  // 4) Demo Users löschen
  await safeDeleteMany("user", {
    where: {
      email: { in: ["admin@digiemu.test", "vendor@digiemu.test"] },
    },
  });

  // 5) Demo Admin erstellen
  const admin = await prisma.user.create({
    data: {
      email: "admin@digiemu.test",
      password: "demo1234", // lokal ok; in prod bitte gehashed / NextAuth flow
      role: "ADMIN",
      name: "Demo Admin",
    },
  });

  // 6) Demo Vendor erstellen
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

  // 7) Demo Produkt erstellen
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
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
