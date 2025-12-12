// src/app/api/checkout/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia",
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const contentType = req.headers.get("content-type") ?? "";
    const accept = req.headers.get("accept") || "";

    // --- 1. productId robust auslesen (JSON ODER FormData) ---
    let productId: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      if (body && typeof body.productId === "string") {
        productId = body.productId;
      }
    } else {
      const formData = await req.formData().catch(() => null);
      const raw = formData?.get("productId");
      if (typeof raw === "string") {
        productId = raw;
      }
    }

    // --- 2. Session prüfen ---
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      // Browser-Flow → redirect zur Login-Seite mit callbackUrl
      if (!accept.includes("application/json")) {
        const callbackPath = productId ? `/product/${productId}` : "/";
        const callbackUrl = encodeURIComponent(callbackPath);

        return NextResponse.redirect(
          `${baseUrl}/login?callbackUrl=${callbackUrl}`,
          302
        );
      }

      // API-Client → JSON-Fehler
      return NextResponse.json(
        { error: "Nicht eingeloggt" },
        { status: 401 }
      );
    }

    const buyerId = session.user.id;

    if (!productId) {
      return NextResponse.json(
        { error: "productId fehlt oder ist ungültig" },
        { status: 400 }
      );
    }

    // --- 3. Produkt laden ---
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
      },
    });

    if (!product || !product.priceCents) {
      return NextResponse.json(
        { error: "Produkt nicht gefunden oder ohne Preis" },
        { status: 404 }
      );
    }

    // --- 4. Stripe Checkout Session erzeugen ---
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "chf",
            unit_amount: product.priceCents,
            product_data: {
              name: product.title,
              description: product.description ?? undefined,
            },
          },
        },
      ],
      success_url: `${baseUrl}/download/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/product/${product.id}`,
      metadata: {
        productId: product.id,
        buyerId,
      },
    });

    // --- 5. Antwort je nach Client-Typ ---
    if (accept.includes("application/json")) {
      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Session" },
      { status: 500 }
    );
  }
}
