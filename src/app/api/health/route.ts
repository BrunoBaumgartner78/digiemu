import { NextResponse } from "next/server";

export async function GET() {
  const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env,
  });
}