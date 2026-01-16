import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.vendorProfile.updateMany({
    // Prisma erlaubt `null` in SQL — falls das Feld nicht nullable ist, ist das ein Datenbereinigungsfall.
    // Der Filter funktioniert trotzdem, wenn die DB tatsächlich NULL-Werte enthält.
    where: { status: null },
    data: { status: "PENDING" },
  });

  console.log("Backfilled VendorProfile.status NULL -> PENDING:", result.count);

  // Optional: approve a specific vendor by setting env VENDOR_ID
  // const vpId = process.env.VENDOR_ID;
  // if (vpId) {
  //   const vp = await prisma.vendorProfile.update({ where: { id: vpId }, data: { status: "APPROVED", isPublic: true } as any });
  //   console.log("Approved vendorProfile:", vp.id);
  // }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
