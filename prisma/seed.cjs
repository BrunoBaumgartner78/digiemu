// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // Helper: führt deleteMany nur aus, wenn Model existiert
  const safeDeleteMany = async (modelName, args = {}) => {
    const model = prisma[modelName];
    if (!model || typeof model.deleteMany !== "function") {
      console.log(`(skip) prisma.${modelName}.deleteMany - model not found`);
      return;
    }
    try {
      const res = await model.deleteMany(args);
      console.log(`(ok) cleared ${modelName}`, res?.count != null ? `count=${res.count}` : "");
    } catch (e) {
      console.log(`(warn) could not clear ${modelName}:`, e?.code ?? e?.message ?? e);
    }
  };

  const ADMIN_EMAIL = "admin@digiemu.test";
  const VENDOR_EMAIL = "vendor@digiemu.test";
  const DEMO_PASSWORD = "demo1234";

  // 1) Admin + Vendor UPSERT (kein Löschen -> keine FK-Probleme)
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: DEMO_PASSWORD,
      role: "ADMIN",
      name: "Demo Admin",
    },
    create: {
      email: ADMIN_EMAIL,
      password: DEMO_PASSWORD, // lokal ok; prod: hash
      role: "ADMIN",
      name: "Demo Admin",
    },
  });

  const vendor = await prisma.user.upsert({
    where: { email: VENDOR_EMAIL },
    update: {
      password: DEMO_PASSWORD,
      role: "VENDOR",
      name: "Demo Vendor User",
    },
    create: {
      email: VENDOR_EMAIL,
      password: DEMO_PASSWORD,
      role: "VENDOR",
      name: "Demo Vendor User",
    },
  });

  // 2) (Optional) Demo-Aktivitäten aufräumen – best effort
  //    Achtung: die where-Filter sind "harmlos" gehalten, weil Schema variieren kann.
  //    Wenn es knallt, wird es geloggt und geht weiter.
  await safeDeleteMany("productView");
  await safeDeleteMany("productLike");
  await safeDeleteMany("like");
  await safeDeleteMany("review");
  await safeDeleteMany("comment");
  await safeDeleteMany("downloadLink");
  await safeDeleteMany("download");
  await safeDeleteMany("orderItem");
  await safeDeleteMany("order");

  // 3) VendorProfile UPSERT (wichtig: basiert auf userId, nicht displayName)
  //    Voraussetzung: in deinem Prisma-Schema ist userId UNIQUE (empfohlen).
  //    Falls userId nicht unique ist, nimm deleteMany({ where:{ userId: vendor.id } }) + create.
  let vendorProfile;

  try {
    vendorProfile = await prisma.vendorProfile.upsert({
      where: { userId: vendor.id }, // <-- hier liegt der FK-Stress: immer am userId festmachen
      update: {
        displayName: "Demo Vendor",
        bio: "Dies ist ein Demo-Verkäufer für Testdaten.",
      },
      create: {
        userId: vendor.id,
        displayName: "Demo Vendor",
        bio: "Dies ist ein Demo-Verkäufer für Testdaten.",
      },
    });
  } catch (e) {
    // Fallback, falls userId NICHT unique ist:
    console.log("(warn) vendorProfile.upsert failed, using delete+create fallback:", e?.code ?? e?.message ?? e);
    await safeDeleteMany("vendorProfile", { where: { userId: vendor.id } });
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId: vendor.id,
        displayName: "Demo Vendor",
        bio: "Dies ist ein Demo-Verkäufer für Testdaten.",
      },
    });
  }

  // 4) Demo-Produkt neu anlegen (vorher nur dieses Demo-Produkt löschen)
  //    Lösche das Produkt, bevor wir es neu erzeugen, damit du nicht 20 Demo-Produkte ansammelst.
  await safeDeleteMany("product", {
    where: { title: "Demo Produkt 1", vendorId: vendor.id },
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
