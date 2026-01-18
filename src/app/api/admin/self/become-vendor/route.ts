import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const session = maybe;
  const maybeUser = session?.user;
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
