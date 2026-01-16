import { prisma } from "../src/lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      isActive: true,
      isPublic: true,
      tenantKey: true,
      vendorProfileId: true,
      vendorProfile: {
        select: {
          id: true,
          status: true,
          isPublic: true,
          tenantKey: true,
          userId: true,
          user: { select: { isBlocked: true } },
        },
      },
      vendor: {
        select: { id: true, isBlocked: true },
      },
    },
  });

  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
