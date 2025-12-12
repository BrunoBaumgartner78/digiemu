// src/app/api/download/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(req: NextRequest, ctx: RouteContext) {
  // params-Promise auflösen (Next 16 App Router)
  const { orderId } = await ctx.params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const buyerId = session.user.id;

  try {
    // DownloadLink + Order holen und sicherstellen, dass die Order dem aktuellen User gehört
    const dl = await prisma.downloadLink.findFirst({
      where: {
        orderId,
        order: {
          buyerId,
        },
      },
      include: {
        order: true,
      },
    });

    if (!dl) {
      return NextResponse.json(
        { error: "Download nicht gefunden oder nicht erlaubt" },
        { status: 404 }
      );
    }

    // Falls dein DownloadLink-Schema expiresAt hat, hier optional Ablauf prüfen:
    // if (dl.expiresAt && dl.expiresAt < new Date()) {
    //   return NextResponse.json(
    //     { error: "Download-Link ist abgelaufen" },
    //     { status: 410 }
    //   );
    // }

    if (!dl.fileUrl) {
      return NextResponse.json(
        { error: "Datei-URL fehlt" },
        { status: 500 }
      );
    }

    // Redirect direkt zur Datei (z.B. Firebase Storage)
    return NextResponse.redirect(dl.fileUrl);
  } catch (err) {
    console.error("❌ Fehler in /api/download/[orderId]:", err);
    return NextResponse.json(
      { error: "Interner Fehler" },
      { status: 500 }
    );
  }
}
