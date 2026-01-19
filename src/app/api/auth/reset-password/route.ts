// src/app/api/auth/reset-password/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Wenn jemand die API-Route im Browser aufruft -> kein 500
export async function GET(req: Request) {
  // Optional: auf forgot-password umleiten
  const url = new URL("/forgot-password", req.url);
  return NextResponse.redirect(url);
  // alternativ: return new NextResponse("Method Not Allowed", { status: 405 });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const rawToken = String(form.get("token") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const password2 = String(form.get("password2") ?? "");

    // UI-Redirects (damit du schöne UX hast)
    const fail = (code: string) => {
      const url = new URL(`/reset-password/${encodeURIComponent(rawToken)}?error=${code}`, req.url);
      return NextResponse.redirect(url);
    };

    if (!rawToken) return fail("missing_token");
    if (!password || password.length < 8) return fail("weak_password");
    if (password !== password2) return fail("password_mismatch");

    const tokenHash = sha256(rawToken);

    const reset = await prisma.passwordReset.findUnique({
      where: { token: tokenHash },
    });

    if (!reset) return fail("invalid_token");
    if (reset.expiresAt < new Date()) return fail("expired");

    // Passwort hashen + user updaten
    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashed },
    });

    // Token verbrauchen
    await prisma.passwordReset.deleteMany({
      where: { userId: reset.userId },
    });

    // Erfolg -> Login
    const okUrl = new URL("/login?reset=1", req.url);
    return NextResponse.redirect(okUrl);
  } catch (err) {
    console.error("RESET_PASSWORD failed:", err);
    // fallback: zurück zur forgot-password Seite
    const url = new URL("/forgot-password?error=reset_failed", req.url);
    return NextResponse.redirect(url);
  }
}
