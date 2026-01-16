// src/app/api/auth/forgot-password/route.ts
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const form = await req.formData();
  const rawEmail = form.get("email");

  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  // immer neutral antworten (keine Info-Leaks)
  const redirectUrl = new URL("/forgot-password?sent=1", req.url);

  if (!email) {
    return NextResponse.redirect(redirectUrl);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(redirectUrl);
  }

  // Optional: alte Tokens aufräumen
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  const token = randomUUID();

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
    },
  });

  // ✅ Reset-Link:
  // `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password/${token}`
  // -> hier Mail senden

  return NextResponse.redirect(redirectUrl);
}
