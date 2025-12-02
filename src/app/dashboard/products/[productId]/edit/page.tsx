"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useToast } from "../../../../../components/ui/use-toast";
// Local ProductLike type for prop typing
type ProductLike = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
};

export default function EditProductForm({ product }: { product: ProductLike }) {
  const { toast } = useToast();

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.priceCents / 100);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/vendor/products/${product.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title,
        description,
        priceCents: Math.round(price * 100),
      }),
    });

    if (!res.ok) {
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht gespeichert werden.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Gespeichert",
      description: "Die Änderungen wurden übernommen.",
    });

    setLoading(false);
    window.location.href = "/dashboard/products";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block mb-1">Titel</label>
        <input
          className="w-full px-3 py-2 rounded bg-[#111] border border-gray-700"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block mb-1">Beschreibung</label>
        <textarea
          className="w-full p-3 rounded bg-[#111] border border-gray-700"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block mb-1">Preis (CHF)</label>
        <input
          type="number"
          min="0"
          step="0.05"
          className="w-full px-3 py-2 rounded bg-[#111] border border-gray-700"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-green-600 text-white font-semibold disabled:opacity-50"
      >
        {loading ? "Speichern..." : "Speichern"}
      </button>
    </form>
  );
}
