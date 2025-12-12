// src/app/api/track-view/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

const VIEW_WINDOW_HOURS = 24;

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    // ------------------------------------------------------------
    // 1) Viewer-ID aus Cookie lesen oder neu generieren
    // ------------------------------------------------------------
    const cookieStore = cookies();
    let viewerId = cookieStore.get("digiemu_vid")?.value ?? null;

    if (!viewerId) {
      viewerId = crypto.randomUUID();
      // Cookie setzen – 1 Jahr gültig
      cookieStore.set("digiemu_vid", viewerId, {
        path: "/",
        httpOnly: false,   // client darf es lesen
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // ------------------------------------------------------------
    // 2) Prüfen, ob es innerhalb der letzten 24h schon eine View gab
    // ------------------------------------------------------------
    const cutoff = new Date(Date.now() - VIEW_WINDOW_HOURS * 60 * 60 * 1000);

    const recentView = await prisma.productView.findFirst({
      where: {
        productId,
        viewerId,
        createdAt: { gte: cutoff },
      },
    });

    if (recentView) {
      return NextResponse.json({
        ok: true,
        deduped: true,
        message: "View already counted within last 24h",
      });
    }

    // ------------------------------------------------------------
    // 3) Neue View speichern
    // ------------------------------------------------------------
    await prisma.productView.create({
      data: {
        productId,
        viewerId,
      },
    });

    return NextResponse.json({
      ok: true,
      stored: true,
    });
  } catch (err) {
    console.error("track-view error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
