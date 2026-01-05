import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { vendorId: string } }
) {
  const session = await getServerSession(auth);
  const role = (session?.user as any)?.role as string | undefined;

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.vendorProfile.update({
    where: { id: params.vendorId },
    data: { status: "SUSPENDED" },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, vendorProfileId: updated.id, status: updated.status });
}
