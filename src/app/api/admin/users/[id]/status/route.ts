import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(auth);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const isBlocked = body?.isBlocked;

  if (typeof isBlocked !== "boolean") {
    return NextResponse.json({ error: "isBlocked must be boolean" }, { status: 400 });
  }

  if (session.user.id === id && isBlocked === true) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst sperren." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlocked },
    select: { id: true, isBlocked: true },
  });

  return NextResponse.json(updated, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
