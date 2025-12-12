import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type RouteContext = {
  params: { id: string };
};

// POST /api/product/[id]/view
export async function POST(_req: Request, context: RouteContext) {
  const productId = context.params.id;
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    let viewerId: string | null = null;
    let setCookieHeader: string | undefined;

    // Try to get user session
    try {
      const session = await getServerSession(authOptions);
      viewerId = session?.user?.id ?? null;
    } catch {
      viewerId = null;
    }

    // If no user, use cookie-based client ID
    if (!viewerId) {
      // Try to get cookie from request
      let clientId: string | null = null;
      const cookieHeader = _req.headers.get("cookie") || "";
      const match = cookieHeader.match(/digiemu_vid=([a-zA-Z0-9_-]{8,})/);
      if (match) {
        clientId = match[1];
      } else {
        // Generate new client ID
        clientId = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
        setCookieHeader = `digiemu_vid=${clientId}; Path=/; Max-Age=31536000; SameSite=Lax`;
      }
      viewerId = clientId;
    }

    // Dedupe: Only one view per viewerId/productId per 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.productView.findFirst({
      where: {
        productId,
        viewerId,
        createdAt: { gte: since },
      },
    });
    if (existing) {
      // Already tracked in last 24h
      const res = NextResponse.json({ ok: true, deduped: true });
      if (setCookieHeader) res.headers.set("Set-Cookie", setCookieHeader);
      return res;
    }

    // Create new view
    await prisma.productView.create({
      data: {
        productId,
        viewerId,
      },
    });
    const res = NextResponse.json({ ok: true });
    if (setCookieHeader) res.headers.set("Set-Cookie", setCookieHeader);
    return res;
  } catch (err) {
    console.error("Error tracking product view", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
