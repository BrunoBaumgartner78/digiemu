// src/app/api/auth/forgot-password/route.ts
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Option B: Debug-Logger (Server) – nur wenn explizit aktiviert
const isDebug = process.env.DEBUG_AUTH_EMAIL === "1";
const dbg = (...args: any[]) => {
  if (isDebug) console.log(...args);
};

export async function POST(req: Request) {
  const form = await req.formData();
  const rawEmail = form.get("email");

  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  // immer neutral antworten (keine Info-Leaks)
  const redirectUrl = new URL("/forgot-password?sent=1", req.url);

  if (!email) {
    return NextResponse.redirect(redirectUrl);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
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

  // ✅ Reset-Link bauen
  const base =
    (process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "") ||
    "https://bellu.ch";

  const resetUrl = `${base}/reset-password/${token}`;

  // ✅ Mail senden (best effort, aber im Zweifel trotzdem neutral redirecten)
  try {
    await sendPasswordResetEmail(user.email, { resetUrl, expiresMinutes: 30 });
    dbg("[forgot-password] reset email sent", { email: user.email });
  } catch (e: any) {
    // bewusst kein hard fail -> keine Info-Leaks
    console.error("[forgot-password] failed to send reset email:", e?.message ?? e);
  }

  return NextResponse.redirect(redirectUrl);
}
