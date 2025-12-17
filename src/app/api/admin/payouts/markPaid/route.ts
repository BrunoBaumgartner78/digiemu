// src/app/api/admin/payouts/mark-paid/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/logAuditEvent";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // 🔐 Nur Admins dürfen auszahlen
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized – Admin privileges required." },
      { status: 403 }
    );
  }

  // payoutId aus FormData oder JSON extrahieren
  let payoutId: string | undefined;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await req.json().catch(() => null);
    payoutId = json?.payoutId;
  } else {
    const form = await req.formData().catch(() => null);
    payoutId = form?.get("payoutId")?.toString();
  }

  if (!payoutId) {
    return NextResponse.json(
      { error: "Missing payoutId" },
      { status: 400 }
    );
  }

  // Existiert das Payout?
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return NextResponse.json(
      { error: "Payout not found" },
      { status: 404 }
    );
  }


  // Wenn bereits bezahlt → 200 OK zurückgeben (idempotent, kein Logging)
  if (payout.status === "PAID") {
    return NextResponse.json({
      message: "Payout was already marked as PAID.",
      payout,
    });
  }

  // Auszahlung als bezahlt markieren
  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // Audit log (fire-and-forget, darf Flow nicht blockieren)
  logAuditEvent({
    actorId: session.user.id,
    action: "PAYOUT_MARKED_AS_PAID",
    targetType: "PAYOUT",
    targetId: updated.id,
    meta: { vendorId: updated.vendorId, amountCents: updated.amountCents },
    // IP/UserAgent optional: req.headers.get("x-forwarded-for") etc.
  });

  return NextResponse.json({
    message: "Payout marked as PAID.",
    payout: updated,
  });
}
