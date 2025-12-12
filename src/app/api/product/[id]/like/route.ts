import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params; // ✅ wichtig: await!

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ... deine Like-Logik hier mit `id`
  return NextResponse.json({ ok: true });
}
