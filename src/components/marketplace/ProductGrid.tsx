"use client";
import { useEffect, useState } from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

type Props = {
  items?: unknown[];
  children?: (item: unknown) => React.ReactNode;
  skeletonCount?: number;
};

export default function ProductGrid({ items = [], children, skeletonCount = 6 }: Props) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // brief skeleton flash during client navigation/hydration
    // defer setting loading to avoid synchronous setState in effect
    const t1 = setTimeout(() => setLoading(true), 0);
    const t2 = setTimeout(() => setLoading(false), 140);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [items.length]);

  if (loading) {
    return (
      <div className="grid">
        {Array.from({ length: skeletonCount }).map((_, i) => (
           
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!children) return null;

  return <div className="grid">{items.map((it) => children(it))}</div>;
}
