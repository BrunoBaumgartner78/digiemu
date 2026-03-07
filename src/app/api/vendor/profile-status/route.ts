import { NextResponse } from "next/server";
import { getOptionalSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // PENDING seller remains BUYER until approved.
  const session = await getOptionalSessionApi();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const vp = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true, isPublic: true },
  });

  return NextResponse.json({
    hasVendorProfile: Boolean(vp),
    status: vp?.status ?? null,
    isPublic: vp?.isPublic ?? false,
    role: session.user.role ?? null,
    isBlocked: session.user.isBlocked ?? false,
  });
}
