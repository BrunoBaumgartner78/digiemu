import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function isBcryptHash(pw: string) {
  return pw.startsWith("$2a$") || pw.startsWith("$2b$") || pw.startsWith("$2y$");
}

async function main() {
  // Nur User mit Passwort, das noch NICHT wie bcrypt aussieht
  const users = await prisma.user.findMany({
    where: {
      password: { not: null },
      // Prisma kann startsWith direkt nutzen:
      NOT: [{ password: { startsWith: "$2" } }],
    },
    select: { id: true, email: true, password: true },
  });

  console.log(`Found ${users.length} users with non-bcrypt passwords.`);

  let updated = 0;
  for (const u of users) {
    const pw = u.password ?? "";
    if (!pw || isBcryptHash(pw)) continue;

    const hash = await bcrypt.hash(pw, 12);
    await prisma.user.update({
      where: { id: u.id },
      data: { password: hash },
    });
    updated++;
    if (updated % 50 === 0) console.log(`...updated ${updated}`);
  }

  console.log(`✅ Done. Updated ${updated} passwords.`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
