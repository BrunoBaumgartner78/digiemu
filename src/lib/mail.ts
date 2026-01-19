import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST!;
const port = Number(process.env.SMTP_PORT || "465");
const secure = port === 465;

const smtpUser = process.env.SMTP_USER!;
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}
