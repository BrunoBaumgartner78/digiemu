// src/app/api/vendor/onboard/route.ts
import { NextResponse } from "next/server";
import { requireSessionApi } from "../../../../lib/guards/authz";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const maybe = await requireSessionApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;

  const email = session.user.email;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Missing email in session" },
      { status: 400 }
    );
  }

  // User aus DB holen, um die ID zu bekommen
  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "User not found in database" },
      { status: 404 }
    );
  }

  const userId = dbUser.id;

  // VendorProfile suchen oder anlegen
  let vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  if (!vendorProfile) {
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId,
        displayName: dbUser.name ?? dbUser.email ?? "Vendor",
                status: "PENDING",
      },
    });
  }

  // Rolle auf VENDOR hochstufen, falls nicht schon ADMIN/VENDOR
  if (dbUser.role !== "ADMIN" && dbUser.role !== "VENDOR") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "VENDOR" },
    });
  }

  return NextResponse.json({ ok: true, vendorProfile });
}
