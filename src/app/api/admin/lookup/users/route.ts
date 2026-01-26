import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const role = (url.searchParams.get("role") ?? "").trim(); // BUYER | VENDOR
    const take = Math.min(Number(url.searchParams.get("take") ?? 20), 50);

    if (!q) return NextResponse.json({ items: [] });

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, email: true, name: true },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({
      items: users.map((u) => ({
        id: u.id,
        label: `${u.email}${u.name ? ` · ${u.name}` : ""}`,
      })),
    });
  } catch (e: any) {
    console.error("[api/admin/lookup/users] ERROR", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
