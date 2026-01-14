// scripts/approve-admin-vendorprofile.ts
import { prisma } from "../src/lib/prisma";

const ADMIN_EMAIL = "DEINEADMINEMAIL@...";

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error("Admin user not found");

  const vp = await prisma.vendorProfile.upsert({
    where: { userId: admin.id },
    update: { status: "APPROVED" as any, isPublic: true },
    create: {
      userId: admin.id,
      status: "APPROVED" as any,
      isPublic: true,
      displayName: "Admin Vendor",
    },
  });

  console.log("Admin vendorProfile OK:", vp.id, vp.status, vp.isPublic);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
