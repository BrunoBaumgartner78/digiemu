import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const userId = (params?.id ?? "").toString();
  const body = await _req.json().catch(() => null);
  const nextStatus = (body?.status ?? "").toString().toUpperCase();

  if (!userId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["PENDING", "APPROVED", "BLOCKED"].includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await prisma.vendorProfile.upsert({
      where: { userId },
      update: { status: nextStatus as any },
      create: {
        userId,
        displayName: null,
        slug: `vendor-${userId.slice(0, 8)}`,
        isPublic: false,
        status: nextStatus as any,
      } as any,
    });

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[admin-vendorprofile-set-status]", e);
    return NextResponse.json({ message: e?.message ?? "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
