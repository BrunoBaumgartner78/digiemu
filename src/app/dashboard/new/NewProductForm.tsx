"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// TODO: Import Firebase upload helpers
// import { uploadFileToFirebase, uploadThumbnailToFirebase } from "@/lib/firebase";

interface NewProductFormProps {
  vendorId: string;
}

export default function NewProductForm({ vendorId }: NewProductFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !description || !category || !price || !file) {
      setError("Bitte fülle alle Pflichtfelder aus und lade eine Datei hoch.");
      return;
    }
    if (Number(price) < 0) {
      setError("Der Preis muss positiv sein.");
      return;
    }
    setUploading(true);
    let fileUrl = "";
    let thumbnailUrl = "";
    try {
      // TODO: Upload file to Firebase Storage
      // fileUrl = await uploadFileToFirebase(file);
      // if (thumbnail) thumbnailUrl = await uploadThumbnailToFirebase(thumbnail);
      // For now, use placeholder URLs
      fileUrl = "https://firebase.example.com/file";
      if (thumbnail) thumbnailUrl = "https://firebase.example.com/thumb";
      // Call API route or server action to create product
      const res = await fetch("/api/products/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          shortDescription,
          category,
          priceCents: Math.round(Number(price) * 100), // TODO: Confirm price mapping
          fileUrl,
          thumbnail: thumbnailUrl,
          status,
          vendorId,
        }),
      });
      if (!res.ok) throw new Error("Produkt konnte nicht erstellt werden.");
      setUploading(false);
      router.push("/dashboard/products");
      // TODO: Show success toast
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen des Produkts.");
      setUploading(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Titel des Produkts"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Beschreibung"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={4}
          />
          <input
            type="text"
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Kurze Beschreibung"
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
          />
          <input
            type="text"
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Kategorie"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="number"
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Preis (CHF)"
            value={price}
            onChange={e => setPrice(e.target.value)}
            min={0}
            required
          />
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="DRAFT">Entwurf</option>
            <option value="PUBLISHED">Veröffentlicht</option>
            <option value="HIDDEN">Versteckt</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500">Produktdatei (PDF, ZIP, etc.)</label>
          <input
            type="file"
            accept=".pdf,.zip,.docx,.xlsx,.pptx,.jpg,.png"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            className="rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500">Thumbnail (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setThumbnail(e.target.files?.[0] || null)}
            className="rounded-xl border px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-md shadow-slate-400/60 hover:bg-slate-800 transition disabled:opacity-60"
        disabled={uploading}
      >
        {uploading ? "Wird erstellt…" : "Produkt erstellen"}
      </button>
    </form>
  );
}
