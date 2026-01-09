"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
  initialStatus?: string;
};

export default function EditProductForm(props: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(props.initialTitle);
  const [description, setDescription] = useState(props.initialDescription);
  const [priceChf, setPriceChf] = useState(props.initialPrice);
  const [category, setCategory] = useState(props.initialCategory);
  const [thumbnailUrl, setThumbnailUrl] = useState(props.initialThumbnail);
  const [isActive, setIsActive] = useState(props.initialIsActive);

  const [thumbFile, setThumbFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [status] = useState(props.initialStatus ?? "DRAFT");
  const isBlocked = status === "BLOCKED";

  function parsePrice(value: string): number | null {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function handleThumbFileChange(e: ChangeEvent<HTMLInputElement>) {
    setThumbFile(e.target.files?.[0] || null);
  }

  async function uploadThumbnailToStorage(file: File) {
    const safeName = file.name.replace(/\s+/g, "-");
    const storageRef = ref(
      storage,
      `thumbnails/${props.id}/${Date.now()}-${safeName}`
    );

    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setThumbProgress(pct);
        },
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  async function handleUploadThumbnail() {
    if (!thumbFile) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setThumbUploading(true);
    setThumbProgress(null);

    try {
      const url = await uploadThumbnailToStorage(thumbFile);
      setThumbnailUrl(url);
      setThumbFile(null);
      setSuccessMsg("Thumbnail wurde hochgeladen.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Thumbnail-Upload fehlgeschlagen.");
    } finally {
      setThumbUploading(false);
      setThumbProgress(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsed = parsePrice(priceChf);
    if (parsed === null) {
      setErrorMsg("Bitte einen gültigen Preis eingeben.");
      return;
    }

    setIsSubmitting(true);

    try {
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
        return;
      }

      setSuccessMsg("Produkt wurde gespeichert!");

      setTimeout(() => {
        router.push("/dashboard/products");
        router.refresh();
      }, 600);
    } catch {
      setErrorMsg("Fehler beim Speichern. Bitte später erneut versuchen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setErrorMsg(null);
    setSuccessMsg(null);

    const ok = confirm(
      "Produkt wirklich löschen? (Es wird archiviert und ist danach nicht mehr sichtbar.)"
    );
    if (!ok) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/products/${props.id}`, { method: "DELETE" });
      if (!res.ok) {
        setErrorMsg("Löschen fehlgeschlagen. Bitte später erneut versuchen.");
        return;
      }

      setSuccessMsg("Produkt wurde gelöscht (archiviert).");
      setTimeout(() => {
        router.push("/dashboard/products");
        router.refresh();
      }, 350);
    } catch {
      setErrorMsg("Löschen fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form className={styles.formShell} onSubmit={handleSubmit}>
      <div className={styles.columns}>
        {/* Spalte 1 */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Produktdetails</h2>

          {isBlocked && (
            <div className={styles.blockedNotice} role="status">
              Dieses Produkt wurde vom Admin gesperrt (BLOCKED). Du kannst es nicht bearbeiten.
            </div>
          )}

          <label className={styles.label}>Titel</label>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isBlocked}
          />

          <label className={styles.label}>Beschreibung</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isBlocked}
          />

          <label className={styles.label}>Kategorie</label>
          <select
            className={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isBlocked}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </section>

        {/* Spalte 2 */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Preis & Sichtbarkeit</h2>

          <label className={styles.label}>Preis (CHF)</label>
          <input
            className={styles.input}
            value={priceChf}
            onChange={(e) => setPriceChf(e.target.value)}
            placeholder="z.B. 19.90"
            disabled={isBlocked}
          />

          <label className={styles.label}>Status</label>
          <div className={styles.toggleRow}>
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`${styles.toggleBtn} ${isActive ? styles.active : ""}`}
              disabled={isBlocked}
            >
              Aktiv
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`${styles.toggleBtn} ${!isActive ? styles.active : ""}`}
              disabled={isBlocked}
            >
              Entwurf
            </button>
          </div>

          <h2 className={styles.sectionTitle} style={{ marginTop: "2rem" }}>
            Thumbnail
          </h2>

          {/* URL */}
          <input
            className={styles.input}
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="/fallback-thumbnail.svg"
            disabled={isBlocked}
          />

    <div className={styles.fileRow}>
  <label className={styles.fileButton}>
    🖼 Bild auswählen
    <input
      type="file"
      accept=".jpg,.jpeg,.png,.webp"
      onChange={handleThumbFileChange}
      className={styles.fileInput}
      disabled={isBlocked}
    />
  </label>

  <span className={styles.fileName}>
    {thumbFile ? thumbFile.name : "Noch kein Bild gewählt"}
  </span>
</div>




          <button
            type="button"
            className={styles.thumbUploadBtn}
            onClick={handleUploadThumbnail}
            disabled={!thumbFile || thumbUploading || isSubmitting || isDeleting || isBlocked}
          >
            {thumbUploading
              ? `Upload läuft…${thumbProgress !== null ? ` ${thumbProgress}%` : ""}`
              : "Thumbnail hochladen"}
          </button>

          <div className={styles.thumbPreview}>
            <img
              src={thumbnailUrl || "/fallback-thumbnail.svg"}
              alt="Thumbnail"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/fallback-thumbnail.svg";
              }}
            />
          </div>
        </section>
      </div>

      <footer className={styles.actionBar}>
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => router.push("/dashboard/products")}
          disabled={isBlocked}
        >
          Abbrechen
        </button>

        <button
          type="button"
          className={styles.dangerBtn}
          onClick={handleDelete}
          disabled={isDeleting || isSubmitting || thumbUploading || isBlocked}
          aria-busy={isDeleting}
        >
          {isDeleting ? "Lösche…" : "Löschen"}
        </button>

        <button
          type="submit"
          disabled={isSubmitting || isDeleting || thumbUploading || isBlocked}
          className={styles.primaryBtn}
        >
          {isSubmitting ? "Speichere…" : "Speichern"}
        </button>
      </footer>
    </form>
  );
}
