import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await getServerSession(auth);
  const user = session?.user as any;
  const userId = user?.id as string | undefined;
  if (!userId || user?.role !== "ADMIN") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const data = {
    displayName: typeof body.displayName === "string" ? body.displayName : "",
    signature: typeof body.signature === "string" ? body.signature : "",
    notifyOnDownload: Boolean(body.notifyOnDownload),
    notifyOnPayoutRequest: Boolean(body.notifyOnPayoutRequest),
  };

  const saved = await prisma.adminProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
