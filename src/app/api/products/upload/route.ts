// src/app/api/products/upload/route.ts
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { requireSessionApi } from "@/lib/guards/authz";

export async function POST(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Block-Check direkt aus der DB (kein extra guards-file nötig)
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true, role: true },
  });

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (me.isBlocked) {
    return NextResponse.json({ error: "Account blocked" }, { status: 403 });
  }

  // Optional: nur Vendor/Admin darf uploaden
  if (me.role !== "VENDOR" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Body (JSON) ---
  const body: unknown = await _req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const b = body as Record<string, unknown>;
  const fileUrl = String(b.fileUrl ?? "").trim();
  const thumbnail = b.thumbnail ? String(b.thumbnail).trim() : null;
  const originalName = b.originalName ? String(b.originalName).trim() : null;

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
  }

  // ✅ Wenn dein Upload-Endpoint nur “Upload bestätigen / Metadaten speichern” soll:
  // -> gib ok zurück. (Wenn du hier DB-Eintrag willst, sag kurz welche Tabelle.)
  return NextResponse.json({
    ok: true,
    fileUrl,
    thumbnail,
    originalName,
    userId,
  });
}
