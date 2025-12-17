// src/app/api/product/view/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => null);

    const productId = body?.productId as string | undefined;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    await prisma.productView.create({
      data: {
        productId,
        viewerId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Product view log error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
