"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
};

export default function LikeButtonClient({
  productId,
  initialLikesCount,
  initialIsLiked,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);

  async function onToggle() {
    // Optimistic UI
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    const res = await fetch(`/api/product/${productId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 401) {
      // zurückrollen
      setIsLiked(isLiked);
      setLikesCount(initialLikesCount);
      router.push(`/login?callbackUrl=/product/${productId}`);
      return;
    }

    if (!res.ok) {
      // zurückrollen bei Fehler
      setIsLiked(isLiked);
      setLikesCount(initialLikesCount);
      return;
    }

    const data: { ok: true; liked: boolean; likesCount: number } = await res.json();

    setIsLiked(data.liked);
    setLikesCount(data.likesCount);

    // Server-Komponenten aktualisieren (optional)
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className="neobtn ghost"
      aria-pressed={isLiked}
      aria-label={isLiked ? "Like entfernen" : "Gefällt mir"}
      style={{ display: "inline-flex", gap: 10, alignItems: "center" }}
    >
      <span aria-hidden="true">{isLiked ? "❤️" : "🤍"}</span>
      <span>{likesCount}</span>
      <span style={{ opacity: 0.7, fontSize: 12 }}>
        {isPending ? "…" : "Likes"}
      </span>
    </button>
  );
}
