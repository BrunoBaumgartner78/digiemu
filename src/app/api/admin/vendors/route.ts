import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

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
    statusRaw === "PENDING" || statusRaw === "APPROVED" || statusRaw === "BLOCKED"
      ? (statusRaw as VendorStatus)
      : undefined;

  const where: any = {};
  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;

  const [total, rows] = await prisma.$transaction([
    prisma.vendorProfile.count({ where }),
    prisma.vendorProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        displayName: true,
        status: true,
        moderationNote: true,
        createdAt: true,
        isPublic: true,
        user: { select: { email: true, role: true, isBlocked: true } },
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
