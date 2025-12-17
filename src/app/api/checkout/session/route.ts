import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

export function GET(req: NextRequest) {
  return new NextResponse("Method Not Allowed", { status: 405 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  const form = await req.formData();
  const productId = form.get("productId");
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, priceCents: true, vendorId: true, isActive: true, status: true },
  });

  if (!product || !product.isActive || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "PRODUCT_NOT_AVAILABLE" }, { status: 404 });
  }

  // ✅ wichtig: immer ORIGIN, niemals ENV mit Pfad
  const origin = req.nextUrl.origin;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "chf",
          unit_amount: product.priceCents,
          product_data: { name: product.title },
        },
      },
    ],
    success_url: `${origin}/download/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/product/${product.id}?canceled=1`,
    metadata: {
      productId: product.id,
      buyerId: userId,
      ...(product.vendorId ? { vendorId: product.vendorId } : {}),
    },
  });

  return NextResponse.redirect(checkout.url as string, { status: 303 });
}
