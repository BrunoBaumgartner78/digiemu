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

type Props = {
  params: Promise<{ token?: string }>;
  searchParams?: Promise<{ error?: string }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "missing_token":
      return "Reset-Link fehlt oder ist ungültig.";
    case "weak_password":
      return "Das Passwort muss mindestens 8 Zeichen lang sein.";
    case "password_mismatch":
      return "Die beiden Passwörter stimmen nicht überein.";
    case "invalid_token":
      return "Der Reset-Link ist ungültig.";
    case "expired":
      return "Der Reset-Link ist abgelaufen. Bitte fordere einen neuen an.";
    case "reset_failed":
      return "Das Passwort konnte nicht zurückgesetzt werden.";
    default:
      return "";
  }
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { token } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error;
  const errorMessage = getErrorMessage(error);

  if (!token || typeof token !== "string") notFound();

  const tokenHash = sha256(token);

  const reset = await prisma.passwordReset.findUnique({
    where: { token: tokenHash },
  });

  if (!reset) {
    notFound();
  }

  const expired = reset.expiresAt < new Date();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>KONTO</div>
          <h1 className={styles.title}>
            {expired ? "Link abgelaufen" : "Neues Passwort"}
          </h1>
          <p className={styles.subtitle}>
            {expired
              ? "Dieser Reset-Link ist nicht mehr gültig. Bitte fordere einen neuen Link an."
              : "Bitte vergib ein neues Passwort für dein Konto."}
          </p>
        </div>

        <div className={styles.glowLine} />

        {errorMessage ? (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255, 120, 120, 0.12)",
              border: "1px solid rgba(255, 120, 120, 0.24)",
              color: "#7a1f1f",
              fontSize: 14,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        {expired ? (
          <div className={styles.row}>
            <a className={styles.button} href="/forgot-password">
              Neuen Reset-Link anfordern
            </a>
          </div>
        ) : (
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

            <div className={styles.row} style={{ marginTop: 10 }}>
              <a className={styles.buttonSecondary} href="/login">
                Zum Login
              </a>
            </div>

            <p className={styles.note}>
              Tipp: Verwende eine Passphrase (3–4 Wörter) oder mindestens 12 Zeichen.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}