// src/app/(public)/login/LoginClient.tsx
"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./LoginPage.module.css";

export default function LoginClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await signIn("credentials", { redirect: false, email, password });

    setLoading(false);

    if (!res || res.error) {
      setErrorMessage("E-Mail oder Passwort ist falsch.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>DigiEmu · Login</div>

        <h1 className={styles.title}>Willkommen zurück 👋</h1>
        <p className={styles.subtitle}>
          Melde dich an, um dein Dashboard, Verkäufe und Produkte zu verwalten.
        </p>

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="email" className={styles.label}>
                E-Mail-Adresse
              </label>
            </div>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="du@beispiel.ch"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="password" className={styles.label}>
                Passwort
              </label>
              <Link href="/forgot-password" className={styles.forgot}>
                Passwort vergessen?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${loading ? styles.buttonDisabled : ""}`}
          >
            {loading ? "Wird eingeloggt…" : "Anmelden"}
          </button>
        </form>

        <div className={styles.meta}>
          Noch kein Konto?{" "}
          <Link href="/register" className={styles.link}>
            Jetzt registrieren
          </Link>
        </div>

        <p className={styles.helper}>
          Mit dem Login akzeptierst du unsere Nutzungsbedingungen und Datenschutzbestimmungen.
        </p>
      </div>
    </div>
  );
}
