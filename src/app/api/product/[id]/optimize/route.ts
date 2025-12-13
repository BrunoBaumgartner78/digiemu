import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: Ctx) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  // TODO: deine echte Logik (analysis) hier rein
  return NextResponse.json({ analysis: { ok: true, productId: id } });
}
