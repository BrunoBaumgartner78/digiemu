// src/app/api/admin/payouts/create/route.ts

import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

// POST /api/admin/payouts/create
export async function POST(_req: Request) {
  const sessionOrResp = await requireAdminApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;

  // 1. Nur Admins dürfen Payouts erstellen
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized – Admin privileges required." },
      { status: 403 }
    );
  }

  // 2. VendorId aus dem FormData/JSON extrahieren
  let vendorId: string | undefined;

  const contentType = _req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await _req.json().catch(() => null);
    vendorId = json?.vendorId;
  } else {
    const form = await _req.formData().catch(() => null);
    vendorId = form?.get("vendorId")?.toString();
  }

  if (!vendorId) {
    return NextResponse.json(
      { error: "Missing vendorId" },
      { status: 400 }
    );
  }

  // 3. Vendor existiert?
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId, role: "VENDOR" },
    include: {
      products: {
        select: {
          orders: {
            select: { vendorEarningsCents: true },
          },
        },
      },
      payouts: true
    }
  });

  if (!vendor) {
    return NextResponse.json(
      { error: "Vendor not found" },
      { status: 404 }
    );
  }

  // 4. Vendor-Earnings berechnen
  const allEarnings = vendor.products.flatMap((p) =>
    p.orders.map((o) => o.vendorEarningsCents || 0)
  );
  const totalEarnings = allEarnings.reduce((a, b) => a + b, 0);

  // bereits ausgezahlt
  const alreadyPaid = vendor.payouts
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + p.amountCents, 0);

  // ausstehende Summe
  const pendingAmount = Math.max(totalEarnings - alreadyPaid, 0);

  if (pendingAmount <= 0) {
    return NextResponse.json(
      { error: "No pending payout amount for this vendor." },
      { status: 400 }
    );
  }

  // 5. Payout erstellen
  const payout = await prisma.payout.create({
    data: {
      vendorId: vendor.id,
      amountCents: pendingAmount,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    message: "Payout created",
    payout,
  });
}
