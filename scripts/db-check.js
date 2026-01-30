// scripts/db-check.js
// Robust DB check: loads .env.local, prints latest orders with amountCents + product.priceCents

try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  console.warn("dotenv not available (ok if env already set).", e?.message);
}

const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

(async () => {
  const url = process.env.DATABASE_URL;
  console.log("DATABASE_URL set?", !!url);
  if (url) console.log("DATABASE_URL preview:", String(url).slice(0, 60) + "...");

  const count = await prisma.order.count();
  console.log("order.count =", count);

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
})()
  .catch((e) => {
    console.error("DB CHECK ERROR:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
// scripts/db-check.js
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL || "";
  const host = url.split("@")[1]?.split("/")[0] || "NO_HOST";

  console.log("HOST =", host);
  console.log("User:", await prisma.user.count());
  console.log("Order:", await prisma.order.count());
  console.log("Product:", await prisma.product.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
