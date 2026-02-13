import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL || "";
  console.log("DATABASE_URL set?", !!url);
  if (url) console.log("DATABASE_URL preview:", String(url).slice(0, 60) + "...");

  const userCount = await prisma.user.count();
  const orderCount = await prisma.order.count();
  const productCount = await prisma.product.count();

  console.log("Users:", userCount);
  console.log("Orders:", orderCount);
  console.log("Products:", productCount);

  const rows = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, title: true, priceCents: true } } },
  });

  console.log(
    rows.map((r) => ({
      id: r.id,
      status: r.status,
      amountCents: r.amountCents,
      productPriceCents: r.product?.priceCents ?? null,
      title: r.product?.title ?? null,
      createdAt: r.createdAt,
    }))
  );
}

main()
  .catch((e) => {
    console.error("DB CHECK ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
