import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const tokenHash = sha256(token);

  const reset = await prisma.passwordReset.findUnique({
    where: { token: tokenHash },
  });

  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token invalid or expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: reset.userId },
    data: { password: passwordHash },
  });

  // invalidate all tokens for user
  await prisma.passwordReset.deleteMany({
    where: { userId: reset.userId },
  });

  return NextResponse.json({ ok: true });
}
