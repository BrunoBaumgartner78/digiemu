import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = session.user as any;

  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    return NextResponse.json({ status: "FORBIDDEN" }, { status: 403 });
  }

  const vp = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: { status: true, isPublic: true },
  });

  return NextResponse.json({
    status: vp?.status ?? "PENDING",
    isPublic: vp?.isPublic ?? false,
  });
}
