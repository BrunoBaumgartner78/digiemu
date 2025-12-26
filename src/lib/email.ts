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

const from = process.env.EMAIL_FROM ?? "no-reply@example.com";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
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
    console.warn("SMTP not configured; skipping sending email to", to);
    console.info("Email preview:", { to, subject, text });
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

export default { sendPurchaseEmail };
