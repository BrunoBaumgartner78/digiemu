// src/lib/email.ts
import nodemailer from "nodemailer";
import {
  buildPurchaseConfirmationText,
  buildPurchaseConfirmationHtml,
} from "./email/templates/purchase-confirmation";

type PurchasePayload = {
  orderId: string;
  productTitle: string;
  downloadUrl: string;
  amountCents: number;
  legalNote?: string;
};

type PasswordResetPayload = {
  resetUrl: string;
  expiresMinutes: number;
};

const from = process.env.EMAIL_FROM ?? "no-reply@example.com";

// Option B: Debug-Logger (Server) – nur wenn explizit aktiviert
const isDebug = process.env.DEBUG_AUTH_EMAIL === "1";
const dbg = (...args: any[]) => {
  if (isDebug) console.log(...args);
};
const dbgWarn = (...args: any[]) => {
  if (isDebug) console.warn(...args);
};

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  } as any);
}

export async function sendPurchaseEmail(to: string, payload: PurchasePayload) {
  const transporter = createTransporter();

  const subject = `Dein Download: ${payload.productTitle}`;
  const purchaseDate = new Date().toLocaleString("de-CH");
  const expiry = payload.downloadUrl && process.env.APP_BASE_URL ? "siehe E-Mail" : "siehe Website";

  const text = buildPurchaseConfirmationText({
    product_name: payload.productTitle,
    purchase_date: purchaseDate,
    order_id: payload.orderId,
    download_link: payload.downloadUrl,
    download_link_expiry: expiry,
    amount: (payload.amountCents / 100).toFixed(2),
  });

  let finalText = text;
  if (payload.legalNote) {
    finalText = `${finalText}\n\n${payload.legalNote}`;
  }

  const html = buildPurchaseConfirmationHtml({
    product_name: payload.productTitle,
    purchase_date: purchaseDate,
    order_id: payload.orderId,
    download_link: payload.downloadUrl,
    download_link_expiry: expiry,
    amount: (payload.amountCents / 100).toFixed(2),
  });

  let finalHtml = html;
  if (payload.legalNote) {
    finalHtml = `${finalHtml}\n<hr/>\n<p style="font-size:12px;opacity:.75;white-space:pre-line">${payload.legalNote}</p>`;
  }

  if (!transporter) {
    // leise in prod, nur im Debug sichtbar
    dbgWarn("[email] SMTP not configured; skipping sending purchase email", { to, subject });
    dbg("[email] purchase email preview", { to, subject, text: finalText });
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text: finalText,
    html: finalHtml,
  });
}

function buildPasswordResetText(d: { resetUrl: string; expiresMinutes: number }) {
  return `Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.

Passwort zurücksetzen: ${d.resetUrl}

Dieser Link ist ${d.expiresMinutes} Minuten gültig.

Wenn du das nicht warst, kannst du diese E-Mail ignorieren.`;
}

function buildPasswordResetHtml(d: { resetUrl: string; expiresMinutes: number }) {
  return `
  <html>
    <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
      <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
      <p>
        <a href="${d.resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;border:1px solid #ccc">
          Passwort zurücksetzen
        </a>
      </p>
      <p style="font-size:12px;opacity:.8">
        Alternativ kannst du diesen Link kopieren:<br/>
        <span style="word-break:break-all">${d.resetUrl}</span>
      </p>
      <p style="font-size:12px;opacity:.8">Dieser Link ist ${d.expiresMinutes} Minuten gültig.</p>
      <hr/>
      <p style="font-size:12px;opacity:.75">Wenn du das nicht warst, kannst du diese E-Mail ignorieren.</p>
    </body>
  </html>
  `;
}

export async function sendPasswordResetEmail(to: string, payload: PasswordResetPayload) {
  const transporter = createTransporter();

  const subject = "Passwort zurücksetzen";
  const text = buildPasswordResetText(payload);
  const html = buildPasswordResetHtml(payload);

  if (!transporter) {
    // leise in prod, nur im Debug sichtbar
    dbgWarn("[email] SMTP not configured; skipping sending password reset email", { to, subject });
    dbg("[email] password reset preview", { to, subject, text });
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export default { sendPurchaseEmail, sendPasswordResetEmail };
