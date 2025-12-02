"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


type ProductForEdit = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  fileUrl: string;
  thumbnail: string | null;
  isActive: boolean;
};

export default function EditProductClient({ product }: { product: ProductForEdit }) {
  const router = useRouter();


  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(product.priceCents / 100);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priceCents: Math.round(price * 100),
        }),
      });

      if (!res.ok) {
        if (typeof window !== "undefined") {
          window.alert("Fehler beim Speichern. Bitte versuche es später erneut.");
        }
        return;
      }

      if (typeof window !== "undefined") {
        window.alert("Produkt aktualisiert");
      }

      router.push("/dashboard/products");
    } catch (error) {
      if (typeof window !== "undefined") {
        window.alert("Serverfehler. Etwas ist schiefgelaufen.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Produkt bearbeiten</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Titel</label>
          <input
            className="w-full px-3 py-2 rounded bg-[#111] border border-gray-700"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Beschreibung</label>
          <textarea
            className="w-full px-3 py-2 rounded bg-[#111] border border-gray-700"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-1">Preis (CHF)</label>
          <input
            type="number"
            min={0}
            step="0.1"
            className="w-full px-3 py-2 rounded bg-[#111] border border-gray-700"
            value={price}
            onChange={e => setPrice(parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-500 disabled:opacity-50"
        >
          {loading ? "Speichern..." : "Speichern"}
        </button>
      </form>
    </div>
  );
}
