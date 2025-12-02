// src/app/register/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./RegisterPage.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem(
      "password"
    ) as HTMLInputElement).value;
    const passwordConfirm = (form.elements.namedItem(
      "passwordConfirm"
    ) as HTMLInputElement).value;
    const role = (form.elements.namedItem("role") as HTMLInputElement).value;

    if (password !== passwordConfirm) {
      setLoading(false);
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    try {
      // 1) User registrieren
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error ||
          data?.message ||
          "Registrierung fehlgeschlagen. Bitte versuche es erneut.";
        throw new Error(message);
      }

      // 2) Direkt einloggen
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        // Falls der Auto-Login scheitert, trotzdem weiterleiten zum Login
        router.push("/login");
        return;
      }

      // 3) Ab ins Dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Es ist ein Fehler aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>DigiEmu • Registrieren</div>

        <h1 className={styles.title}>Konto erstellen ✨</h1>
        <p className={styles.subtitle}>
          Erstelle dein DigiEmu-Konto, um Produkte zu verkaufen oder digitale
          Inhalte zu kaufen.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Max Muster"
              required
              className={styles.input}
            />
          </div>

          {/* E-Mail */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="du@beispiel.ch"
              required
              className={styles.input}
            />
          </div>

          {/* Passwort */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              className={styles.input}
            />
          </div>

          {/* Passwort bestätigen */}
          <div className={styles.field}>
            <label htmlFor="passwordConfirm" className={styles.label}>
              Passwort bestätigen
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              className={styles.input}
            />
          </div>

          {/* Rolle (Buyer / Vendor) */}
          <div className={styles.field}>
            <span className={styles.label}>Kontotyp</span>
            <div className={styles.roleToggle}>
              <label className={styles.roleOption}>
                <input
                  type="radio"
                  name="role"
                  value="BUYER"
                  defaultChecked
                />
                <span>Käufer:in</span>
              </label>
              <label className={styles.roleOption}>
                <input type="radio" name="role" value="VENDOR" />
                <span>Verkäufer:in</span>
              </label>
            </div>
            <p className={styles.helperInline}>
              Du kannst dein Konto später jederzeit erweitern.
            </p>
          </div>

          {/* Fehlermeldung */}
          {error && <p className={styles.error}>{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${
              loading ? styles.buttonDisabled : ""
            }`}
          >
            {loading ? "Konto wird erstellt…" : "Konto erstellen"}
          </button>
        </form>

        <div className={styles.meta}>
          Bereits ein Konto?{" "}
          <Link href="/login" className={styles.link}>
            Zum Login
          </Link>
        </div>

        <p className={styles.helper}>
          Mit der Registrierung akzeptierst du unsere Nutzungsbedingungen und
          Datenschutzbestimmungen.
        </p>
      </div>
    </div>
  );
}
