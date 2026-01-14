"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./RegisterPage.module.css";

type RegisterErrorResponse = {
  error?: string;
  message?: string;
};

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
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const passwordConfirm = (form.elements.namedItem("passwordConfirm") as HTMLInputElement).value;
    const role = (form.elements.namedItem("role") as HTMLInputElement).value;

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data: RegisterErrorResponse | null = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message ?? "Registrierung fehlgeschlagen. Bitte versuche es erneut.";
        setError(message);
        setLoading(false);
        return;
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginRes?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("REGISTER FETCH ERROR:", err);
      setError("Netzwerkfehler. Bitte versuche es erneut.");
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
          Erstelle dein DigiEmu-Konto, um Produkte zu verkaufen oder digitale Inhalte zu kaufen.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Name</label>
            <input id="name" name="name" type="text" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>E-Mail-Adresse</label>
            <input id="email" name="email" type="email" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Passwort</label>
            <input id="password" name="password" type="password" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="passwordConfirm" className={styles.label}>Passwort bestätigen</label>
            <input id="passwordConfirm" name="passwordConfirm" type="password" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Kontotyp</span>
            <div className={styles.roleToggle}>
              <label>
                <input type="radio" name="role" value="BUYER" defaultChecked />
                Käufer:in
              </label>
              <label>
                <input type="radio" name="role" value="VENDOR" />
                Verkäufer:in
              </label>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Konto wird erstellt…" : "Konto erstellen"}
          </button>
        </form>

        <div className={styles.meta}>
          Bereits ein Konto? {" "}
          <Link href="/login" className={styles.link}>
            Zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}
