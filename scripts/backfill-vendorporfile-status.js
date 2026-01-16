import { prisma } from "@/lib/prisma";

async function main() {
  const beforeNull = await prisma.vendorProfile.count({
    where: { status: null },
  });

  const res = await prisma.vendorProfile.updateMany({
    where: { status: null },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: "PENDING" as any },
  });

  const afterNull = await prisma.vendorProfile.count({
    where: { status: null },
  });

  console.log("VendorProfile.status backfill");
  console.log("NULL before:", beforeNull);
  console.log("Updated:", res.count);
  console.log("NULL after:", afterNull);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
