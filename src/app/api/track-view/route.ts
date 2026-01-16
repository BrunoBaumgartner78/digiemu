// src/app/api/track-view/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request) {
  try {
    const body = await _req.json().catch(() => ({}));
    const productId = String(body?.productId ?? "").trim();

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // ✅ Next 16 / Turbopack: cookies() kann Promise sein -> await
    const cookieStore = await cookies();

    let viewerId = cookieStore.get("digiemu_vid")?.value ?? null;

    if (!viewerId) {
      viewerId = crypto.randomUUID();
      cookieStore.set("digiemu_vid", viewerId, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 Jahr
      });
    }

    // Optional: Logging in DB (passe Felder an dein Schema an)
    // Wenn du eine Tabelle "ProductView" hast:
    // await prisma.productView.create({ data: { productId, viewerId } });

    // Wenn du nur einen Counter im Product hast:
    // await prisma.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } });

    return NextResponse.json({ ok: true, viewerId });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Track view failed", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
