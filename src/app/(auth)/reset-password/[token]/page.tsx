// src/app/(auth)/reset-password/[token]/page.tsx
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token?: string }>;
}) {
  const { token } = await params;

  if (!token || typeof token !== "string") notFound();

  const tokenHash = sha256(token);

  const reset = await prisma.passwordReset.findUnique({
    where: { token: tokenHash },
  });

  if (!reset || reset.expiresAt < new Date()) notFound();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>KONTO</div>
          <h1 className={styles.title}>Neues Passwort</h1>
          <p className={styles.subtitle}>
            Bitte vergib ein neues Passwort für dein Konto.
          </p>
        </div>

        <div className={styles.glowLine} />

        {/* Client-Form via native POST to API route */}
        <form className={styles.form} action="/api/auth/reset-password" method="POST">
          <input type="hidden" name="token" value={token} />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Neues Passwort
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password2">
              Passwort wiederholen
            </label>
            <input
              className={styles.input}
              id="password2"
              name="password2"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Nochmal eingeben"
            />
          </div>

          <div className={styles.row}>
            <button className={styles.button} type="submit">
              Passwort speichern
            </button>
          </div>

          <p className={styles.note}>
            Tipp: Verwende eine Passphrase (3–4 Wörter) oder mindestens 12 Zeichen.
          </p>
        </form>
      </div>
    </div>
  );
}
