import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json({
      ok: true,
      count: products.length,
      products,
      db_url: process.env.DATABASE_URL || "not found",
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      db_url: process.env.DATABASE_URL || "not found",
    }, { status: 500 });
  }
}
