"use client";

import { useState } from "react";
import styles from "./LikeButtonClient.module.css";

type LikeButtonProps = {
  productId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
};

export default function LikeButtonClient({
  productId,
  initialLikesCount,
  initialIsLiked,
}: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!productId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/product/${productId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Fehler");

      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.likeButton} ${
          isLiked ? styles.isActive : ""
        }`}
        disabled={isLoading}
        onClick={handleClick}
      >
        <span className={styles.icon} aria-hidden="true">
          {isLiked ? "❤️" : "🤍"}
        </span>
        <span className={styles.label}>
          {isLiked ? "Gemerkt" : "Merken"}
        </span>
        <span className={styles.count}>{likesCount}</span>
      </button>
    </div>
  );
}
