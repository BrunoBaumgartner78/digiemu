// src/app/api/vendor/onboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

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

  // VendorProfile suchen oder anlegen (tenant-scoped)
  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  let vendorProfile = await prisma.vendorProfile.findUnique({
    where: { tenantKey_userId: { tenantKey, userId } },
  });

  if (!vendorProfile) {
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        tenantKey,
        userId,
        displayName: dbUser.name ?? dbUser.email ?? "Vendor",
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
