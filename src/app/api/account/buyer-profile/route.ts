import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export async function PUT(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body: unknown = await _req.json().catch(() => null);
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const avatarUrl = typeof b.avatarUrl === "string" ? b.avatarUrl : "";
  if (avatarUrl.startsWith("blob:")) {
    return NextResponse.json({ error: "INVALID_IMAGE_URL", message: "Bitte Avatar zuerst hochladen." }, { status: 400 });
  }

  const data = {
    displayName: typeof b.displayName === "string" ? b.displayName : "",
    bio: typeof b.bio === "string" ? b.bio : "",
    avatarUrl,
    isPublic: Boolean(b.isPublic),
  };

  const saved = await prisma.buyerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
