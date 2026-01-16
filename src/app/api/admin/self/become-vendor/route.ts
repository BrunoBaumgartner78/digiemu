import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);

  const maybeUser = session?.user;
  if (!isRecord(maybeUser) || getStringProp(maybeUser, "role") !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = getStringProp(maybeUser, "id");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing userId in session" }, { status: 400 });
  }

  // Exists?
  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    // If it exists but is not approved, upgrade to APPROVED (admin self-trust for testing)
    if (existing.status !== "APPROVED") {
      const upgraded = await prisma.vendorProfile.update({
        where: { userId },
        data: { status: "APPROVED" },
      });
      return NextResponse.json({ ok: true, vendorProfile: upgraded, upgraded: true });
    }
    return NextResponse.json({ ok: true, vendorProfile: existing });
  }

  const created = await prisma.vendorProfile.create({
    data: {
      userId,
      displayName: getStringProp(maybeUser, "name") ?? "Admin Vendor",
      bio: "",
      status: "APPROVED",
    },
  });

  return NextResponse.json({ ok: true, vendorProfile: created, created: true });
}
