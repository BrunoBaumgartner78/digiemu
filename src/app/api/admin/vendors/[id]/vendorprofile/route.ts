import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  status?: "PENDING" | "APPROVED" | "BLOCKED";
  isPublic?: boolean;
};

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params; // userId
  if (!id) return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });

  const body = (await _req.json().catch(() => ({}))) as Body;

  const nextStatus = body.status;
  const nextIsPublic = body.isPublic;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Ensure user exists and is vendor
      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true },
      });
      if (!user) throw new Error("User not found");
      if (user.role !== "VENDOR") throw new Error("User is not a vendor");

      // Ensure vendorProfile exists
      const vp = await tx.vendorProfile.findUnique({
        where: { userId: id },
        select: { id: true, status: true, isPublic: true },
      });

      if (!vp) throw new Error("VendorProfile fehlt. Vendor muss zuerst /become-seller ausführen.");

      const data: Partial<{ status: "PENDING" | "APPROVED" | "BLOCKED"; isPublic: boolean }> = {};
      if (nextStatus) data.status = nextStatus as "PENDING" | "APPROVED" | "BLOCKED";
      if (typeof nextIsPublic === "boolean") data.isPublic = nextIsPublic;

      const newVp = await tx.vendorProfile.update({
        where: { userId: id },
        data,
        select: { id: true, status: true, isPublic: true },
      });

      return newVp;
    });

    return NextResponse.json({ ok: true, vendorProfile: updated });
  } catch (e: unknown) {
    console.error("[admin vendors vendorprofile]", e);
    const getMessage = (err: unknown) => {
      if (typeof err === "string") return err;
      if (err && typeof err === "object" && "message" in err) {
        const m = (err as Record<string, unknown>).message;
        return typeof m === "string" ? m : JSON.stringify(m);
      }
      return "Server error";
    };
    return NextResponse.json({ ok: false, message: getMessage(e) }, { status: 500 });
  }
}
