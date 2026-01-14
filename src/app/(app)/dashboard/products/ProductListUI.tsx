"use client";

import { useTransition } from "react";

type Product = {
  id: string;
  title: string;
  priceCents: number;
  thumbnail: string | null;
  category: string;
  isActive: boolean;
};

type Props = {
  products: Product[];
};

export default function ProductListUI({ products }: Props) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    startTransition(async () => {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      // TODO: optional: Router-Refresh oder Zustand lokal updaten
    });
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div key={p.id} className="product-card">
          {p.thumbnail && (
            <img
              src={p.thumbnail}
              alt={p.title}
              className="thumb"
            />
          )}
          <h2>{p.title}</h2>
          <p>{(p.priceCents / 100).toFixed(2)} CHF</p>
          <p>{p.category}</p>
          <button
            disabled={isPending}
            onClick={() => handleDelete(p.id)}
          >
            Löschen
          </button>
        </div>
      ))}
    </div>
  );
}
