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
      // ...existing code...
    } catch (error) {
      // ...existing code...
    }
  }

  // ...existing code...
}
