// src/app/api/products/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

// ⬇️ Passe diesen Import ggf. an deinen echten Pfad an:
import { requireNotBlocked } from "@/lib/guards";

export async function POST(req: Request) {
  // Optional: Session check (falls deine guard das NICHT selbst macht)
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ FIX: authOptions übergeben
  const guard = await requireNotBlocked(authOptions);

  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: 403 });
  }

  // --- Payload lesen (z.B. aus deinem Upload-Client) ---
  // Je nach Implementierung kann das JSON sein oder FormData.
  // Wir machen JSON als default, weil du an anderen Routes auch JSON nutzt.
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Erwartete Felder (je nach deinem Flow)
  const fileUrl = String(body?.fileUrl ?? "").trim();
  const thumbnail = body?.thumbnail ? String(body.thumbnail).trim() : null;
  const originalName = body?.originalName ? String(body.originalName).trim() : null;

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
  }

  // ✅ Minimaler Erfolg-Response (du kannst hier auch DB-Logik einbauen)
  return NextResponse.json({
    ok: true,
    fileUrl,
    thumbnail,
    originalName,
    userId,
  });
}
