import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(auth);

  // keep legacy semantics
  if (!session?.user?.id) {
    return NextResponse.json({ status: "UNAUTHENTICATED" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ status: "FORBIDDEN" }, { status: 403 });
  }

  const vp = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true, isPublic: true },
  });

  return NextResponse.json({
    status: vp?.status ?? "PENDING",
    isPublic: vp?.isPublic ?? false,
  });
}
