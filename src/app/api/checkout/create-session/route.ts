import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: Request) {
  const auth = await getServerSession(authOptions);
  if (!auth?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const productId = body?.productId as string | undefined;
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      priceCents: true,
      vendorId: true,
      isActive: true,
      status: true,
    },
  });

  if (!product || !product.isActive || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "PRODUCT_NOT_AVAILABLE" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

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

    // ✅ URLs gehören NUR hierhin (top-level)
    success_url: `${baseUrl}/download/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/product/${product.id}?canceled=1`,

    // ✅ metadata nur kleine strings (IDs, etc.)
    metadata: {
      productId: product.id,
      buyerId: auth.user.id,
      vendorId: product.vendorId,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
