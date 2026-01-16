// src/app/dashboard/new/NewProductForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./NewProductForm.module.css";

/**
 * Wichtig:
 * Passe den Fetch-Pfad /api/vendor/products an deinen bestehenden
 * API-Endpoint an, falls er anders heisst.
 */
export default function NewProductForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [priceChf, setPriceChf] = useState<string>("9.90");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("Bitte gib einen Titel ein.");
      return;
    }

    const numericPrice = parseFloat(priceChf.replace(",", "."));
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setErrorMsg("Bitte gib einen gültigen Preis an.");
      return;
    }

    const priceCents = Math.round(numericPrice * 100);

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/vendor/products", {
        // ⬅️ HIER ggf. den Pfad anpassen
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceCents,
          thumbnail: thumbnail.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Produkt konnte nicht angelegt werden.");
      }

      setSuccessMsg("Produkt wurde angelegt.");
      // kurz anzeigen, dann zur Übersicht
      setTimeout(() => {
        router.push("/dashboard/products");
        router.refresh();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Unbekannter Fehler.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Linke Spalte */}
        <div className={styles.colMain}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="title">
              Titel
            </label>
            <input
              id="title"
              className={styles.input}
              type="text"
              placeholder="Z. B. ‚Workbook: DigiEmu Launch Guide‘"
              value={title}
              onChange={(_e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="description">
              Beschreibung
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              rows={6}
              placeholder="Beschreibe kurz den Inhalt deines digitalen Produkts, Zielgruppe und Nutzen."
              value={description}
              onChange={(_e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Rechte Spalte */}
        <div className={styles.colSide}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="price">
              Preis (CHF)
            </label>
            <div className={styles.priceRow}>
              <input
                id="price"
                className={styles.input}
                type="number"
                step="0.05"
                min="0"
                value={priceChf}
                onChange={(_e) => setPriceChf(e.target.value)}
              />
              <span className={styles.priceHint}>inkl. MwSt. / Sofort-Download</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="thumbnail">
              Thumbnail-URL (optional)
            </label>
            <input
              id="thumbnail"
              className={styles.input}
              type="url"
              placeholder="https://…/dein-thumbnail.png"
              value={thumbnail}
              onChange={(_e) => setThumbnail(e.target.value)}
            />
            <p className={styles.helpText}>
              Später kannst du hier dein Bild aus Firebase / Storage eintragen
              oder automatisch setzen lassen.
            </p>
          </div>

          {/* Status / Info */}
          <div className={styles.infoBox}>
            <div className={styles.infoTitle}>Veröffentlichung</div>
            <p className={styles.infoText}>
              Neue Produkte starten standardmäßig als <strong>aktiv</strong>{" "}
              (sichtbar im Marketplace), sobald Preis und Download-Datei
              korrekt hinterlegt sind. Du kannst den Status später jederzeit in
              der Produkt-Bearbeitung anpassen.
            </p>
          </div>

          {/* Messages */}
          {errorMsg && <p className={styles.error}>{errorMsg}</p>}
          {successMsg && <p className={styles.success}>{successMsg}</p>}

          {/* Aktionen */}
          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Speichere …" : "Produkt anlegen"}
            </button>
           <button
  type="button"
  className={styles.secondaryBtn}
  onClick={() => router.push("/dashboard/products")}
>
  Abbrechen
</button>

          </div>
        </div>
      </form>
    </section>
  );
}
