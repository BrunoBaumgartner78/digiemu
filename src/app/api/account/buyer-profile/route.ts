import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(_req: Request) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : "";
  if (avatarUrl.startsWith("blob:")) {
    return NextResponse.json({ error: "INVALID_IMAGE_URL", message: "Bitte Avatar zuerst hochladen." }, { status: 400 });
  }

  const data = {
    displayName: typeof body.displayName === "string" ? body.displayName : "",
    bio: typeof body.bio === "string" ? body.bio : "",
    avatarUrl,
    isPublic: Boolean(body.isPublic),
  };

  const saved = await prisma.buyerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
