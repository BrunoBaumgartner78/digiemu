"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// TODO: Import Firebase upload helpers
// import { uploadFileToFirebase, uploadThumbnailToFirebase } from "@/lib/firebase";

interface EditProductFormProps {
  product: {
    id: string;
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    priceCents: number;
    fileUrl: string;
    thumbnail?: string;
    status: string;
  };
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState((product.priceCents / 100).toString());
  const [status, setStatus] = useState(product.status);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title || !description || !category || !price) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      return;
    }
    if (Number(price) < 0) {
      setError("Der Preis muss positiv sein.");
      return;
    }
    setUploading(true);
    let fileUrl = product.fileUrl;
    let thumbnailUrl = product.thumbnail || "";
    try {
      // TODO: Upload new file/thumbnail to Firebase if selected
      // if (file) fileUrl = await uploadFileToFirebase(file);
      // if (thumbnail) thumbnailUrl = await uploadThumbnailToFirebase(thumbnail);
      // Call API route to update product
      const res = await fetch(`/api/products/edit-product/${product.id}`, {
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
        }),
      });
      if (!res.ok) throw new Error("Produkt konnte nicht aktualisiert werden.");
      setUploading(false);
      setSuccess("Produkt erfolgreich aktualisiert.");
      router.push("/dashboard/products");
    } catch (err: any) {
      setError(err.message || "Fehler beim Aktualisieren des Produkts.");
      setUploading(false);
    }
  }

  // Optional: Delete action
  async function handleDelete() {
    if (!confirm("Produkt wirklich löschen?")) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      // TODO: Implement delete API route or server action
      // For now, just mark as HIDDEN
      const res = await fetch(`/api/products/delete/${product.id}`, {
        method: "POST" });
      if (!res.ok) throw new Error("Produkt konnte nicht gelöscht werden.");
      setUploading(false);
      router.push("/dashboard/products");
    } catch (err: any) {
      setError(err.message || "Fehler beim Löschen des Produkts.");
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
            className="rounded-xl border px-3 py-2 text-sm"
          />
          {product.fileUrl && (
            <div className="text-xs text-slate-400 mt-1">Aktuelle Datei: <a href={product.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">Ansehen</a></div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500">Thumbnail (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setThumbnail(e.target.files?.[0] || null)}
            className="rounded-xl border px-3 py-2 text-sm"
          />
          {product.thumbnail && (
            <div className="text-xs text-slate-400 mt-1">Aktuelles Thumbnail: <img src={product.thumbnail} alt="Thumbnail" className="inline-block h-8 w-8 rounded" /></div>
          )}
        </div>
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      {success && <div className="text-green-500 text-sm text-center">{success}</div>}
      <div className="flex gap-4 justify-center mt-4">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-md shadow-slate-400/60 hover:bg-slate-800 transition disabled:opacity-60"
          disabled={uploading}
        >
          {uploading ? "Wird aktualisiert…" : "Produkt speichern"}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-2 text-sm font-medium text-white shadow-md shadow-red-400/60 hover:bg-red-600 transition disabled:opacity-60"
          disabled={uploading}
          onClick={handleDelete}
        >
          Produkt löschen
        </button>
      </div>
    </form>
  );
}
