// src/app/api/products/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fileUrl = String(body?.fileUrl ?? "").trim();
  const thumbnail = body?.thumbnail ? String(body.thumbnail).trim() : null;
  const originalName = body?.originalName ? String(body.originalName).trim() : null;

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
