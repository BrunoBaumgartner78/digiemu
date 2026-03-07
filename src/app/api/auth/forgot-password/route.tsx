// src/app/api/auth/forgot-password/route.ts
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { serverLog } from "@/lib/serverLog";
import { rateLimitCheck, keyFromReq } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function getBaseUrl(req: Request) {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "";

  const fallbackFromReq = new URL(req.url).origin;

  const base = String(envUrl || fallbackFromReq).trim().replace(/\/$/, "");

  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    return fallbackFromReq.replace(/\/$/, "");
  }

  return base;
}

export async function POST(req: Request) {
  try {
    try {
      const key = keyFromReq(req, "auth_forgot");
      const rl = rateLimitCheck(key, 6, 60_000);
      if (!rl.allowed) {
        const redirectUrl = new URL("/forgot-password?sent=1", req.url);
        return NextResponse.redirect(redirectUrl, { headers: { "Cache-Control": "no-store" } });
      }
    } catch (e) {
      console.warn("rateLimit check failed", e);
    }
  } catch (e) {
    // noop - continue
  }

  const form = await req.formData();
  const email = normEmail(form.get("email"));

  const redirectUrl = new URL("/forgot-password?sent=1", req.url);

  if (!email) {
    serverLog.warn?.("FORGOT_PASSWORD: missing email");
    return NextResponse.redirect(redirectUrl, { headers: { "Cache-Control": "no-store" } });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Immer neutral bleiben
  if (!user) {
    serverLog.log(`FORGOT_PASSWORD: user not found for ${email}`);
    return NextResponse.redirect(redirectUrl, { headers: { "Cache-Control": "no-store" } });
  }

  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: tokenHash,
      expiresAt,
    },
  });

  const baseUrl = getBaseUrl(req);
  const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || "").trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = (process.env.MAIL_FROM || smtpUser).trim();

  serverLog.log(
    `FORGOT_PASSWORD: route reached email=${email} userFound=${!!user} baseUrl=${baseUrl} host=${host} port=${port} secure=${secure} smtpUser=${!!smtpUser} smtpPass=${!!smtpPass} from=${!!from}`
  );

  if (!smtpUser || !smtpPass || !from) {
    console.warn("MAIL: missing SMTP env vars, skip sending.");
    return NextResponse.redirect(redirectUrl, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();
    serverLog.log("MAIL: transporter verify ok");

    const info = await transporter.sendMail({
      from,
      to: user.email,
      subject: "Passwort zurücksetzen – Bellu",
      text: `Du hast ein neues Passwort angefordert.

Link: ${resetUrl}

Der Link ist 30 Minuten gültig.

Wenn du das nicht warst, ignoriere diese E-Mail.`,
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
          <p style="margin:12px 0 0;color:#64748b;font-size:12px;word-break:break-all">
            Falls der Button nicht funktioniert, kopiere diesen Link:<br />
            ${resetUrl}
          </p>
        </div>
      `,
    });

    serverLog.log(
      `MAIL: sent reset link messageId=${info.messageId ?? "n/a"} response=${info.response ?? "n/a"} accepted=${Array.isArray(info.accepted) ? info.accepted.join(",") : "n/a"} rejected=${Array.isArray(info.rejected) ? info.rejected.join(",") : "n/a"}`
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("MAIL: send failed", err.message, err.stack);
    } else {
      console.error("MAIL: send failed", String(err));
    }
  }

  return NextResponse.redirect(redirectUrl, { headers: { "Cache-Control": "no-store" } });
}