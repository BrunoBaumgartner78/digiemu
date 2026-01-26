import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";

export async function POST(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await _req.json();

  const title = String(data.title ?? "").trim();
  const description = String(data.description ?? "").trim();
  const category = String(data.category ?? "").trim();
  const fileUrl = String(data.fileUrl ?? "").trim();
  const thumbnail = data.thumbnail ? String(data.thumbnail).trim() : null;

  // Accept either a CHF price input (e.g. priceChf: 1.5) or explicit priceCents.
  let priceCents: number | undefined;
  if (data && typeof (data as any).priceChf !== "undefined") {
    const v = (data as any).priceChf;
    const priceChf = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    if (!Number.isFinite(priceChf) || priceChf < 0) priceCents = undefined;
    else priceCents = Math.round(priceChf * 100);
  } else if (data && typeof (data as any).priceCents !== "undefined") {
    priceCents = Number((data as any).priceCents);
  }

  if (!title || !fileUrl || !Number.isFinite(priceCents as number) || (priceCents as number) < 0) {
    return NextResponse.json(
      { error: "Invalid payload (title, fileUrl, priceCents required)" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      title,
      description,
      category,
      fileUrl,
      thumbnail,
      priceCents: priceCents as number,

      // Relation connect (weil vendorId required, aber nicht direkt setzbar)
      vendor: { connect: { id: userId } },
    },
  });

  return NextResponse.json(product);
}
