"use client";

import { useState, FormEvent } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./LoginPage.module.css";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
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

    if (!res || res.error) {
      setLoading(false);
      setErrorMessage("E-Mail oder Passwort ist falsch.");
      return;
    }

    // ✅ Session neu einlesen (Cookie ist jetzt gesetzt)
    const session = await getSession();
    const role = session?.user?.role;

    // ✅ Optional: callbackUrl respektieren (wenn vorhanden)
    const callbackUrl = sp.get("callbackUrl");

    if (callbackUrl) {
      router.replace(callbackUrl);
      return;
    }

    // ✅ Rollen-Ziel: Buyer NICHT auf /dashboard schicken
    if (role === "ADMIN" || role === "VENDOR") {
      router.replace("/dashboard");
    } else {
      // BUYER: weg von /account/downloads (dead end ohne menu) → Home
      router.replace("/");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>Bellu · Login</div>

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
            <label htmlFor="email" className={styles.label}>E-Mail-Adresse</label>
            <input id="email" type="email" name="email" required autoComplete="email" className={styles.input} />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="password" className={styles.label}>Passwort</label>
              <Link href="/forgot-password" className={styles.forgot}>Passwort vergessen?</Link>
            </div>
            <input id="password" type="password" name="password" required autoComplete="current-password" className={styles.input} />
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
          <Link href="/register" className={styles.link}>Jetzt registrieren</Link>
        </div>
      </div>
    </div>
  );
}
