import { NextResponse } from "next/server";
import { getOptionalSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getOptionalSessionApi();

  // keep legacy semantics: unauthenticated -> special payload
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
