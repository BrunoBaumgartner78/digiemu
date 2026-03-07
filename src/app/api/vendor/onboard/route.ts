// src/app/api/vendor/onboard/route.ts
import { NextResponse } from "next/server";
import { requireSessionApi } from "../../../../lib/guards/authz";
import { prisma } from "@/lib/prisma";

// Legacy compatibility route.
// Vendor role is granted only after admin approval.
export async function POST() {
  const maybe = await requireSessionApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;

  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Missing user id in session" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "User not found in database" },
      { status: 404 }
    );
  }

  // PENDING seller remains BUYER until approved.
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
          } else if (vendorProfile.status !== "BLOCKED" && vendorProfile.status !== "APPROVED") {
            vendorProfile = await prisma.vendorProfile.update({
              where: { userId },
              data: {
                status: "PENDING",
                displayName: vendorProfile.displayName ?? dbUser.name ?? dbUser.email ?? "Vendor",
              },
            });
  }

          return NextResponse.json({ ok: true, vendorProfile, nextUrl: "/sell?status=pending" });
}
