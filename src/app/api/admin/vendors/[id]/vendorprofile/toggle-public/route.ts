import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";
import type { VendorStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  const maybeUser = session?.user;
  if (!isRecord(maybeUser) || getStringProp(maybeUser, "role") !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const userId = (params?.id ?? "").toString();
  if (!userId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const updated = await prisma.vendorProfile.update({
      where: { userId },
      data: { isPublic: { set: true } },
      select: { userId: true, isPublic: true, status: true },
    }).catch(async () => {
      const created = await prisma.vendorProfile.create({
        data: {
          userId,
          displayName: null,
          slug: `vendor-${userId.slice(0, 8)}`,
          isPublic: true,
          status: "PENDING" as VendorStatus,
        },
        select: { userId: true, isPublic: true, status: true },
      });
      return created;
    });

    await prisma.vendorProfile.update({ where: { userId }, data: { isPublic: !updated.isPublic } });
    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    console.error("[admin-vendorprofile-toggle-public]", e);
    return NextResponse.json({ message: getErrorMessage(e) }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
