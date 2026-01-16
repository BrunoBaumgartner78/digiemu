// scripts/db-check.js
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const url = process.env.DATABASE_URL || "";
  const host = url.split("@")[1]?.split("/")[0] || "NO_HOST";

  console.log("HOST =", host);
  console.log("User:", await prisma.user.count());
  console.log("Order:", await prisma.order.count());
  console.log("Product:", await prisma.product.count());
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
