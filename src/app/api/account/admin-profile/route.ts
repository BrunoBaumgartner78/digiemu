import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(_req: Request) {
  const session = await getServerSession(auth);
  const user = session?.user;
  const userId = user?.id as string | undefined;
  if (!userId || user?.role !== "ADMIN") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });

  const body = (await _req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const b = body as Record<string, unknown>;
  const data = {
    displayName: typeof b.displayName === "string" ? b.displayName : "",
    signature: typeof b.signature === "string" ? b.signature : "",
    notifyOnDownload: Boolean(b.notifyOnDownload),
    notifyOnPayoutRequest: Boolean(b.notifyOnPayoutRequest),
  };

  const saved = await prisma.adminProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
