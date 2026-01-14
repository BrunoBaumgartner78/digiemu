// src/app/api/product/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// stable day key in UTC
function dayKey(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json({ ok: false, reason: "MISSING_PRODUCT_ID" }, { status: 400 });
  }

  // Identify user if logged in
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  // best-effort anonymous fingerprint (works behind proxies too)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const fingerprint = `${ip}__${ua}`.slice(0, 190);

  const day = dayKey();

  // Preferred: idempotent upsert (requires unique indexes in ProductView)
  // If the unique indexes are missing, we fall back to create() so dev won't crash.
  try {
    await prisma.productView.upsert({
      where: userId
        ? { productId_userId_day: { productId, userId, day } }
        : { productId_fingerprint_day: { productId, fingerprint, day } },
      create: userId ? { productId, userId, day } : { productId, fingerprint, day },
      update: {}, // idempotent
    });
  } catch {
    // Fallback if the compound uniques are not there yet
    try {
      await prisma.productView.create({
        data: userId ? { productId, userId, day } : { productId, fingerprint, day },
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
