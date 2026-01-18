import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const { id } = await context.params; // userId
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  try {
    const vp = await prisma.vendorProfile.findUnique({
      where: { userId: id },
      select: { id: true, isPublic: true },
    });

    if (!vp) {
      return NextResponse.json(
        { message: "VendorProfile nicht gefunden." },
        { status: 404 }
      );
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: vp.id },
      data: { isPublic: !vp.isPublic },
      select: { id: true, isPublic: true },
    });

    return NextResponse.json({ ok: true, vendorProfile: updated });
  } catch (e: unknown) {
    console.error("[admin/vendors/toggle-public]", e);
    const getMessage = (err: unknown) => {
      if (typeof err === "string") return err;
      if (err && typeof err === "object" && "message" in err) {
        const m = (err as Record<string, unknown>).message;
        return typeof m === "string" ? m : JSON.stringify(m);
      }
      return "Server error";
    };
    return NextResponse.json({ message: getMessage(e) }, { status: 500 });
  }
}
