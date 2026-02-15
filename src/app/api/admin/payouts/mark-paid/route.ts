// src/app/api/admin/payouts/mark-paid/route.ts
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const sessionOrResp = await requireAdminApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let payoutId = "";
  let returnTo = "";

  const ct = (_req.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    const json = await _req.json().catch(() => null);
    payoutId = String((json as any)?.payoutId ?? "").trim();
    returnTo = String((json as any)?.returnTo ?? "").trim();
  } else if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const form = await _req.formData().catch(() => null);
    payoutId = String(form?.get("payoutId") ?? "").trim();
    returnTo = String(form?.get("returnTo") ?? "").trim();
  } else {
    // Fallback: try json anyway (some fetch clients omit headers)
    const json = await _req.json().catch(() => null);
    payoutId = String((json as any)?.payoutId ?? "").trim();
    returnTo = String((json as any)?.returnTo ?? "").trim();
  }

  if (!payoutId) {
    return NextResponse.json({ error: "Missing payoutId" }, { status: 400 });
  }

  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // optional redirect hint (falls du später zurück navigieren willst)
  return NextResponse.json({ ok: true, payout: updated, returnTo: returnTo || null });
}
