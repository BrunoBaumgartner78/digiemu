import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionBody = {
  action: "revoke" | "extendExpiry" | "resetCounter";
  downloadLinkId: string;
  payload?: unknown;
};

export async function POST(req: Request) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return maybe;

  const body: ActionBody = await req.json();
  const { action, downloadLinkId, payload } = body;

  if (!downloadLinkId) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    if (action === "revoke") {
      // mark as inactive
      await prisma.downloadLink.update({ where: { id: downloadLinkId }, data: { isActive: false } });
      // TODO: write audit log if model exists
      return NextResponse.json({ ok: true });
    }

    if (action === "extendExpiry") {
      const days = Number((payload as Record<string, unknown>)?.days ?? 0);
      if (!Number.isFinite(days) || days <= 0) return NextResponse.json({ error: "invalid days" }, { status: 400 });
      const dl = await prisma.downloadLink.findUnique({ where: { id: downloadLinkId }, select: { expiresAt: true } });
      const base = dl?.expiresAt ?? new Date();
      const next = new Date(base);
      next.setDate(next.getDate() + days);
      await prisma.downloadLink.update({ where: { id: downloadLinkId }, data: { expiresAt: next } });
      return NextResponse.json({ ok: true, expiresAt: next.toISOString() });
    }

    if (action === "resetCounter") {
      await prisma.downloadLink.update({ where: { id: downloadLinkId }, data: { downloadCount: 0 } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
