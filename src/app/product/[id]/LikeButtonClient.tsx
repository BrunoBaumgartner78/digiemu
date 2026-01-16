"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type LikeButtonProps = {
  productId: string;
};

export default function LikeButtonClient({ productId }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/products/${productId}/like`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        setIsLiked(!!data.liked);
        setCount(
          typeof data.likesCount === "number" ? data.likesCount : 0
        );
      } catch (_err) {
        console.error("Fehler beim Laden der Likes:", _err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function toggleLike() {
    if (loading) return;
    setLoading(true);
    setRequiresLogin(false);

    try {
      const res = await fetch(`/api/products/${productId}/like`, {
        method: "POST",
      });

      if (res.status === 401) {
        setRequiresLogin(true);
        return;
      }

      if (!res.ok) {
        console.error("Like-Request fehlgeschlagen");
        return;
      }

      const data = await res.json();
      setIsLiked(!!data.liked);
      setCount(
        typeof data.likesCount === "number" ? data.likesCount : 0
      );
    } catch (_err) {
      console.error("Fehler beim Toggle-Like:", _err);
    } finally {
      setLoading(false);
    }
  }

  const displayCount = count ?? 0;

  return (
    <div className={styles.socialRow}>
      <button
        type="button"
        onClick={toggleLike}
        disabled={loading}
        className={`${styles.likeButton} ${
          isLiked ? styles.likeButtonActive : ""
        }`}
        aria-pressed={isLiked}
      >
        <span className={styles.likeIcon} aria-hidden="true">
          {isLiked ? "❤" : "♡"}
        </span>
        <span className={styles.likeLabel}>Auf Merkliste</span>
        <span className={styles.likeCount}>{displayCount}</span>
      </button>

      {requiresLogin && (
        <span className={styles.loginHint}>
          Bitte einloggen, um Produkte zu merken.
        </span>
      )}
    </div>
  );
}
