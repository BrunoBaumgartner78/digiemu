import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20" as any,
});

export function GET() {
  return new NextResponse("This endpoint is deprecated. Use /api/checkout/create-session.", { status: 410 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "This endpoint is deprecated. Use /api/checkout/create-session." }, { status: 410 });
}
