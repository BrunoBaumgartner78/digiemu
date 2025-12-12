"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./EditProductForm.module.css";

const CATEGORY_OPTIONS = [
  { value: "ebook", label: "E-Book" },
  { value: "template", label: "Template / Vorlage" },
  { value: "course", label: "Kurs / Training" },
  { value: "audio", label: "Audio / Meditation" },
  { value: "video", label: "Video / Vortrag" },
  { value: "coaching", label: "Coaching / Session" },
  { value: "bundle", label: "Bundle / Paket" },
  { value: "other", label: "Sonstiges" },
];

type Props = {
  id: string;
  initialTitle: string;
  initialDescription: string;
  initialPrice: string;
  initialCategory: string;
  initialThumbnail: string;
  initialIsActive: boolean;
};

export default function EditProductForm(props: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(props.initialTitle);
  const [description, setDescription] = useState(props.initialDescription);
  const [priceChf, setPriceChf] = useState(props.initialPrice);
  const [category, setCategory] = useState(props.initialCategory);
  const [thumbnailUrl, setThumbnailUrl] = useState(props.initialThumbnail);
  const [isActive, setIsActive] = useState(props.initialIsActive);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function parsePrice(value: string): number | null {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = parsePrice(priceChf);
    if (parsed === null) {
      setErrorMsg("Bitte einen gültigen Preis eingeben.");
      return;
    }

    setIsSubmitting(true);

    const res = await fetch(`/api/products/${props.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priceChf: parsed,
        category,
        thumbnailUrl: thumbnailUrl || null,
        isActive,
      }),
    });

    if (!res.ok) {
      setErrorMsg("Fehler beim Speichern. Bitte später erneut versuchen.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMsg("Produkt wurde gespeichert!");

    setTimeout(() => {
      router.push("/dashboard/products");
      router.refresh();
    }, 600);
  }

  return (
    <form className={styles.formShell} onSubmit={handleSubmit}>
      {/* Hauptbereich */}
      <div className={styles.columns}>

        {/* Spalte 1 – Produktdetails */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Produktdetails</h2>

          <label className={styles.label}>Titel</label>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className={styles.label}>Beschreibung</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className={styles.label}>Kategorie</label>
          <select
            className={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </section>

        {/* Spalte 2 – Preis, Status & Thumbnail */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Preis & Sichtbarkeit</h2>

          <label className={styles.label}>Preis (CHF)</label>
          <input
            className={styles.input}
            value={priceChf}
            onChange={(e) => setPriceChf(e.target.value)}
            placeholder="z.B. 19.90"
          />

          <label className={styles.label}>Status</label>
          <div className={styles.toggleRow}>
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`${styles.toggleBtn} ${isActive ? styles.active : ""}`}
            >
              Aktiv
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`${styles.toggleBtn} ${!isActive ? styles.active : ""}`}
            >
              Entwurf
            </button>
          </div>

          <h2 className={styles.sectionTitle} style={{ marginTop: "2rem" }}>
            Thumbnail
          </h2>

          <input
            className={styles.input}
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="/fallback-thumbnail.svg"
          />

          <div className={styles.thumbPreview}>
            <img
              src={thumbnailUrl || "/fallback-thumbnail.svg"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/fallback-thumbnail.svg";
              }}
            />
          </div>
        </section>
      </div>

      {/* Footer/Aktionen */}
      <footer className={styles.actionBar}>
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => router.push("/dashboard/products")}
        >
          Abbrechen
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.primaryBtn}
        >
          {isSubmitting ? "Speichere…" : "Speichern"}
        </button>
      </footer>
    </form>
  );
}
