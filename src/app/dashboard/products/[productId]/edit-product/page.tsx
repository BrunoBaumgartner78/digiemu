"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useToast } from "../../../../../components/ui/use-toast";
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
    }
    setLoading(false);
  }

  // ...existing code...
}
