import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

// TEMP DEBUG: welche DB nutzt Next wirklich?
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  const u = process.env.DATABASE_URL || "";
  console.log("🧩 NEXT DATABASE_URL host:", u.split("@")[1]?.split("/")[0] ?? "NONE");

}

console.log("🧩 NEXT DATABASE_URL host:", new URL(process.env.DATABASE_URL!).host);
