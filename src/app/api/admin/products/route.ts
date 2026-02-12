import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
const { ProductStatus } = Prisma;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getParam(req: NextRequest, key: string) {
  return req.nextUrl.searchParams.get(key) ?? "";
}
function getInt(req: NextRequest, key: string, fallback: number) {
  const v = Number(getParam(req, key));
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

export async function GET(req: NextRequest) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const q = getParam(req, "q").trim();
  const statusRaw = getParam(req, "status").trim().toUpperCase();
  const page = getInt(req, "page", 1);
  const pageSize = Math.min(getInt(req, "pageSize", 25), 100);

  const status =
    statusRaw === "ACTIVE" || statusRaw === "DRAFT" || statusRaw === "BLOCKED"
      ? (statusRaw as ProductStatus)
      : undefined;

  const where: any = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (status) where.status = status;

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        priceCents: true,
        status: true,
        isActive: true,
        moderationNote: true,
        createdAt: true,
        vendorId: true,
        vendor: { select: { email: true } },
      },
    }),
  ]);

  return NextResponse.json(
    {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      rows,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
