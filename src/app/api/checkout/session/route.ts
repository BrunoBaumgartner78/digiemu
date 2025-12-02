import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await getServerSession();

  const { productId } = await req.json();

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session?.user?.email,
    line_items: [
      {
        price_data: {
          currency: "chf",
          product_data: {
            name: product.title,
            images: product.thumbnail ? [product.thumbnail] : [],
          },
          unit_amount: product.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/download/success?pid=${product.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}`,
  });

  return NextResponse.json({ url: checkout.url });
}
