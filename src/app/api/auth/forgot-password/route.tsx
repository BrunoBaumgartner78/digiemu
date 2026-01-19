// src/app/api/auth/forgot-password/route.ts
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export async function POST(req: Request) {
  const form = await req.formData();
  const email = normEmail(form.get("email"));

  // Immer neutral antworten (kein Account-Leak)
  const redirectUrl = new URL("/forgot-password?sent=1", req.url);
  if (!email) return NextResponse.redirect(redirectUrl);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.redirect(redirectUrl);

  // Alte Tokens entfernen (optional)
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  // Raw token (für URL) + Hash (für DB)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: tokenHash, // <-- HASH speichern
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
    },
  });

  // Reset-Link (RAW token)
  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const resetUrl = `${String(appUrl).replace(/\/$/, "")}/reset-password/${rawToken}`;

  // SMTP ENV
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, ""); // sicherheitshalber spaces raus
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.MAIL_FROM || smtpUser;

  // Debug ohne Passwort
  console.log("SMTP DEBUG", {
    host,
    port,
    secure,
    user: smtpUser,
    from,
    to: user.email,
    passLen: smtpPass.length,
  });

  // Wenn SMTP nicht konfiguriert: neutral redirect (kein Leak)
  if (!smtpUser || !smtpPass || !from) {
    console.warn("MAIL: missing SMTP env vars, skip sending.");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    // optional, hilft beim Debuggen:
    await transporter.verify();

    await transporter.sendMail({
      from,
      to: user.email,
      subject: "Passwort zurücksetzen – Bellu",
      text: `Du hast ein neues Passwort angefordert.\n\nLink: ${resetUrl}\n\nDer Link ist 30 Minuten gültig.\n\nWenn du das nicht warst, ignoriere diese E-Mail.`,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px">Passwort zurücksetzen</h2>
          <p style="margin:0 0 12px">Du hast ein neues Passwort angefordert.</p>
          <p style="margin:0 0 12px">
            <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:999px;text-decoration:none;border:1px solid #cbd5e1">
              👉 Passwort jetzt zurücksetzen
            </a>
          </p>
          <p style="margin:0;color:#64748b;font-size:12px">Der Link ist 30 Minuten gültig.</p>
        </div>
      `,
    });

    console.log("MAIL: sent reset link to", user.email);
  } catch (err: any) {
    console.error("MAIL: send failed", err?.message ?? err);
    // bewusst neutral bleiben
  }

  return NextResponse.redirect(redirectUrl);
}
