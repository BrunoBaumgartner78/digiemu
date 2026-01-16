// src/app/dashboard/new/page.tsx
"use client";

import { useState, FormEvent, ChangeEvent, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import styles from "./NewProductForm.module.css";

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

type ProfileStatusResponse = {
  status?: string | null;
  isPublic?: boolean | null;
};

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileStatusResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/vendor/profile-status", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as ProfileStatusResponse | null;
        if (!alive) return;
        setProfile(json);
      } catch {
        if (!alive) return;
        setProfile(null);
      } finally {
        if (!alive) return;
        setLoadingProfile(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const { vendorStatus, needsApproval, blockReason } = useMemo(() => {
    const s = (profile?.status ?? "").toString().toUpperCase();
    const needs = s !== "APPROVED";
    const reason = needs
      ? `Dein Verkäuferprofil ist noch nicht freigeschaltet (Status: ${s || "PENDING"}). Du kannst erst Produkte anlegen, wenn ein Admin dich geprüft hat.`
      : null;
    return { vendorStatus: s, needsApproval: needs, blockReason: reason };
  }, [profile]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceChf, setPriceChf] = useState("9.90");

  // Kategorie
  const [category, setCategory] = useState<string>("ebook");

  // Standard-Thumbnail = Fallback aus /public
  const [thumbnailUrl, setThumbnailUrl] = useState("/fallback-thumbnail.svg");

  // Dateien
  const [file, setFile] = useState<File | null>(null); // Produktdatei
  const [thumbFile, setThumbFile] = useState<File | null>(null); // Thumbnail-Bild

  // UI-Status
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datei-Handler
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] || null);
  }

  // Note: don't fully block rendering here — show a hint card in the page and disable submit instead.

  function handleThumbFileChange(e: ChangeEvent<HTMLInputElement>) {
    setThumbFile(e.target.files?.[0] || null);
  }

  async function uploadToStorage(pathPrefix: string, f: File) {
    const safeName = f.name.replace(/\s+/g, "-");
    const storageRef = ref(storage, `${pathPrefix}/${Date.now()}-${safeName}`);

    const uploadTask = uploadBytesResumable(storageRef, f);

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(pct);
        },
        (_err) => reject(err),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    // Client-side gate: if vendor not approved, show toast and block submit
    if (!loadingProfile && needsApproval) {
      toast({
        title: "Freischaltung ausstehend",
        description: blockReason || "Dein Verkäuferprofil ist noch nicht freigeschaltet.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Bitte gib einen Titel ein.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Bitte gib eine kurze Beschreibung ein.");
      return;
    }

    // ✅ Preis-Validierung (Komma & Punkt) + Mindestpreis 1 CHF
    const normalizedPrice = priceChf.replace(",", ".").trim();
    const priceNumber = Number(normalizedPrice);

    if (!Number.isFinite(priceNumber)) {
      setErrorMessage("Bitte gib einen gültigen Preis in CHF ein.");
      return;
    }
    if (priceNumber < 1) {
      setErrorMessage("Der Mindestpreis beträgt 1.00 CHF.");
      return;
    }

    if (!file) {
      setErrorMessage("Bitte wähle eine Datei für dein Produkt aus.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      // 1) Optional: Thumbnail hochladen (wenn leer -> Fallback)
      let finalThumbnailUrl = thumbnailUrl.trim() || "/fallback-thumbnail.svg";

      if (thumbFile) {
        setStatusMessage("Lade Thumbnail-Bild hoch …");
        const thumbUrl = await uploadToStorage("thumbnails", thumbFile);
        finalThumbnailUrl = thumbUrl;
        // optional: UI sofort anpassen
        setThumbnailUrl(thumbUrl);
      }

      // 2) Produktdatei hochladen
      setStatusMessage("Lade Produktdatei hoch …");
      const downloadUrl = await uploadToStorage("products", file);

      // 3) Produkt in der DB anlegen
      setStatusMessage("Speichere Produkt …");

      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceChf: priceNumber,
          downloadUrl,
          thumbnailUrl: finalThumbnailUrl || null,
          category,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        // Vendor not approved -> show toast and stay on page (403 with machine-readable status)
          if (res.status === 403) {
            toast({
              title: "Freischaltung ausstehend",
              description: data?.message || `Dein Verkäuferprofil ist noch nicht freigeschaltet (Status: ${data?.status ?? "PENDING"}).`,
              variant: "destructive",
            });
            return;
          }

        const msg =
          (typeof data?.message === "string" && data.message.trim()) ||
          (res.status === 403
            ? "Du hast keine Berechtigung oder dein Verkäuferprofil ist noch nicht freigeschaltet."
            : "Produkt konnte nicht angelegt werden.");
        throw new Error(msg);
      }

      setStatusMessage("Produkt erfolgreich angelegt.");
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 600);
    } catch (err: any) {
      console.error("Produkt anlegen fehlgeschlagen:", err);
      setErrorMessage(err?.message || "Upload oder Speichern ist fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <main className="page-shell-wide">
      <div className={styles.wrapper}>
        <Link href="/dashboard/products" className={styles.backLink}>
          Zur Produktübersicht
        </Link>

        <header style={{ marginTop: "0.6rem", marginBottom: "1.4rem" }}>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Neues Produkt anlegen
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl mt-1.5">
            Trage Titel, Beschreibung und Preis ein. Lade anschließend deine Datei
            (z. B. PDF, ZIP oder Bild) hoch. Nach dem Speichern erscheint dein Produkt
            im Marketplace.
          </p>
        </header>

        {!loadingProfile && needsApproval && (
          <div className="neumorph-card p-4 mb-4 border border-[var(--neo-card-border)]">
            <div className="text-sm font-semibold">Freischaltung erforderlich</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{blockReason}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="neobtn-sm ghost" href="/dashboard/products">
                Zur Produktübersicht
              </Link>
              <Link className="neobtn-sm ghost" href="/profile">
                Profil ansehen
              </Link>
            </div>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Linke Spalte: Eingaben */}
          <div className={styles.colMain}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Titel</label>
              <input
                className={styles.input}
                type="text"
                placeholder="z.B. Workbook, Leitfaden, Kursunterlagen …"
                value={title}
                onChange={(_e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Beschreibung</label>
              <textarea
                className={styles.textarea}
                placeholder="Beschreibe kurz, was Käufer nach dem Download erhalten."
                value={description}
                onChange={(_e) => setDescription(e.target.value)}
              />
            </div>

            {/* Kategorie-Auswahl */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Kategorie</label>
              <select
                className={`${styles.input} ${styles.select}`}
                value={category}
                onChange={(_e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className={styles.priceHint}>
                Die Kategorie wird für Filter im Marketplace verwendet (z.B. E-Books,
                Kurse, Audio, Templates …).
              </p>
            </div>

            {/* Preis */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Preis (CHF)</label>
              <div className={styles.priceRow}>
                <input
                  className={styles.input}
                  type="number"
                  step="0.05"
                  min="1"
                  placeholder="z.B. 9.90"
                  value={priceChf}
                  onChange={(_e) => setPriceChf(e.target.value)}
                />
                <p className={styles.priceHint}>
                  Mindestpreis: <strong>1.00 CHF</strong> · inkl. MwSt. / digitale Leistung
                  (sofern zutreffend)
                </p>
              </div>
            </div>

            {/* Thumbnail-URL + Live-Vorschau */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Thumbnail-URL (optional)</label>
              <input
                className={styles.input}
                type="text"
                placeholder="https://example.com/dein-bild.jpg oder /fallback-thumbnail.svg"
                value={thumbnailUrl}
                onChange={(_e) => setThumbnailUrl(e.target.value)}
              />
              <p className={styles.priceHint}>
                Lässt du dieses Feld leer, verwenden wir automatisch{" "}
                <code>/fallback-thumbnail.svg</code> aus deinem <code>public/</code>-Ordner.
              </p>

              {/* Vorschau */}
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                <div
                  style={{
                    width: "160px",
                    height: "100px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(148,163,184,0.55)",
                    boxShadow:
                      "6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light)",
                    background: "var(--bg-soft)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl || "/fallback-thumbnail.svg"}
                    alt="Thumbnail-Vorschau"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(_e) => {
                      const img = e.currentTarget;
                      const fallback = "/fallback-thumbnail.svg";
                      if (!img.src.endsWith(fallback)) img.src = fallback;
                    }}
                  />
                </div>

                <p className={styles.priceHint} style={{ maxWidth: "220px" }}>
                  Die Vorschau aktualisiert sich automatisch, wenn du die URL änderst.
                </p>
              </div>
            </div>

            {/* Produktdatei-Upload */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                DATEI / BILD HOCHLADEN (PRODUKTDATEI)
              </label>
              <div className={styles.fileRow}>
                <label className={styles.fileButton}>
                  📁 Datei auswählen
                  <input
                    type="file"
                    accept=".pdf,.zip,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </label>
                <span className={styles.fileName}>
                  {file ? file.name : "Noch keine Datei gewählt"}
                </span>
              </div>
              <p className={styles.priceHint}>
                Diese Datei wird als Download-Link für Käufer:innen verwendet.
              </p>
            </div>

            {/* Thumbnail-Upload */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>THUMBNAIL-BILD HOCHLADEN (OPTIONAL)</label>
              <div className={styles.fileRow}>
                <label className={styles.fileButton}>
                  🖼 Bild auswählen
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleThumbFileChange}
                    className={styles.fileInput}
                  />
                </label>
                <span className={styles.fileName}>
                  {thumbFile ? thumbFile.name : "Noch kein Bild gewählt"}
                </span>
              </div>
              <p className={styles.priceHint}>
                Optionales Vorschaubild für dein Produkt. Wenn du hier ein Bild hochlädst,
                wird die Thumbnail-URL automatisch gesetzt.
              </p>
            </div>

            {uploadProgress !== null && (
              <p className={styles.priceHint}>Upload: {uploadProgress}% …</p>
            )}

            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            {statusMessage && !errorMessage && (
              <p className={styles.success}>{statusMessage}</p>
            )}

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => router.push("/dashboard/products")}
              >
                Abbrechen
              </button>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || (!loadingProfile && needsApproval)}
                data-create-product-submit
              >
                {isSubmitting ? "Wird angelegt …" : "Produkt anlegen"}
              </button>
            </div>
          </div>

          {/* Rechte Spalte: Info-Box */}
          <aside className={styles.colSide}>
            <div className={styles.infoBox}>
              <h2 className={styles.infoTitle}>Veröffentlichung</h2>
              <p className={styles.infoText}>
                Neue Produkte starten standardmäßig als <strong>aktiv</strong> (sichtbar im
                Marketplace), sobald Preis und Download-Datei korrekt hinterlegt sind.
              </p>
              <p className={styles.infoText} style={{ marginTop: "0.8rem" }}>
                Für die ersten Tests genügt ein PDF oder ZIP. Später kannst du professionelle
                Thumbnails hochladen.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
