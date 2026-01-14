"use client";
import { useEffect, useState } from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

type Props = {
  items?: any[];
  children?: (item: any) => React.ReactNode;
  skeletonCount?: number;
};

export default function ProductGrid({ items = [], children, skeletonCount = 6 }: Props) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // brief skeleton flash during client navigation/hydration
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 140);
    return () => clearTimeout(t);
  }, [items.length]);

  if (loading) {
    return (
      <div className="grid">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!children) return null;

  return <div className="grid">{items.map((it) => children(it))}</div>;
}
