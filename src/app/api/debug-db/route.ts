import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  // nur Host zeigen, keine Secrets
  const host = url.split("@")[1]?.split("/")[0] ?? "NO_DB_URL";
  const hasPooler = host.includes("pooler");
  return NextResponse.json({ host, hasPooler });
}
