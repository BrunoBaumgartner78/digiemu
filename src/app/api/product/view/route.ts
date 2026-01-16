// src/app/api/product/view/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";

function dayKey(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await _req.json().catch(() => null);

    const productId = isRecord(body) ? (getStringProp(body, "productId") ?? undefined) : undefined;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const user = (session?.user as { id?: string; role?: string } | null) ?? null;
    const userId = user?.id as string | undefined;

    const ip =
      (_req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || _req.headers.get("x-real-ip") || "unknown";
    const ua = _req.headers.get("user-agent") || "unknown";
    const fingerprint = `${ip}__${ua}`.slice(0, 190);

    const today = dayKey();

    try {
      await prisma.productView.upsert({
        where: userId
          ? { productId_userId_day: { productId, userId, day: today } }
          : { productId_fingerprint_day: { productId, fingerprint, day: today } },
        create: userId ? { productId, userId, day: today } : { productId, fingerprint, day: today },
        update: {},
      });
    } catch (_e) {
      try {
        await prisma.productView.create({
          data: userId ? { productId, userId, day: today } : { productId, fingerprint, day: today },
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ ok: true });
  } catch (_err: unknown) {
    console.error("Product view log error", getErrorMessage(_err));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
