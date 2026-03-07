// src/app/api/auth/reset-password/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { rateLimitCheck, keyFromReq } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function GET(req: Request) {
  const url = new URL("/forgot-password", req.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: Request) {
  try {
    try {
      const key = keyFromReq(req, "auth_reset");
      const rl = rateLimitCheck(key, 10, 60_000);
      if (!rl.allowed) {
        const url = new URL("/forgot-password?error=rate_limited", req.url);
        return NextResponse.redirect(url, { status: 303 });
      }
    } catch (_e) {
      console.warn("rateLimit check failed", _e);
    }

    const form = await req.formData();

    const rawToken = String(form.get("token") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const password2 = String(form.get("password2") ?? "");

    const fail = (code: string) => {
      const url = new URL(
        `/reset-password/${encodeURIComponent(rawToken)}?error=${code}`,
        req.url
      );
      return NextResponse.redirect(url, { status: 303 });
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

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashed, sessionVersion: { increment: 1 } as any },
      }) as any,
      prisma.passwordReset.deleteMany({
        where: { userId: reset.userId },
      }),
    ]);

    const okUrl = new URL("/login?reset=1", req.url);
    return NextResponse.redirect(okUrl, { status: 303 });
  } catch (err) {
    console.error("RESET_PASSWORD failed:", err);
    const url = new URL("/forgot-password?error=reset_failed", req.url);
    return NextResponse.redirect(url, { status: 303 });
  }
}