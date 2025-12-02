"use client";


import { useState } from "react";
import ProductCard from "./ProductCard";
import type { ProductCardProps } from "./ProductCard";
import { useToast } from "../../../components/ui/use-toast";


type ProductListUIProps = {
  products: ProductCardProps[];
};

export default function ProductListUI({ products }: ProductListUIProps) {
  const { toast } = useToast();
  const [localProducts, setLocalProducts] = useState<ProductCardProps[]>(products);

  async function handleDelete(id: string) {
    if (!confirm("Produkt wirklich löschen?")) return;

    const res = await fetch(`/api/vendor/products/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast({
        title: "Löschen fehlgeschlagen",
        variant: "destructive",
      });
      return;
    }

    setLocalProducts((prev: ProductCardProps[]) => prev.filter((p: ProductCardProps) => p.id !== id));

    toast({
      title: "Produkt gelöscht",
    });
  }

  return (
    <div className="grid gap-5">
      {localProducts.map((product: ProductCardProps) => (
        <ProductCard
          key={product.id}
          {...product}
          onEdit={() => alert("Bearbeiten nicht implementiert")}
          onDelete={() => handleDelete(product.id)}
        />
      ))}
    </div>
  );
}
