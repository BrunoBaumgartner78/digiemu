import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.vendorProfile.updateMany({
    // Prisma erlaubt `null` in SQL — falls das Feld nicht nullable ist, ist das ein Datenbereinigungsfall.
    // Der Filter funktioniert trotzdem, wenn die DB tatsächlich NULL-Werte enthält.
    where: { status: null },
    data: { status: "PENDING" },
  });

  console.log("Backfilled VendorProfile.status NULL -> PENDING:", result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
