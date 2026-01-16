import { NextRequest, NextResponse } from "next/server";
// Deprecated endpoint: keep minimal handlers

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return new NextResponse(
    "This endpoint is deprecated. Use /api/checkout/create-session.",
    { status: 410 }
  );
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { message: "This endpoint is deprecated. Use /api/checkout/create-session." },
    { status: 410 }
  );
}
