import { prisma } from "../src/lib/prisma";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.vendorProfile.updateMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { status: null as any }, // Prisma typing: allow null check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: "PENDING" as any },
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
