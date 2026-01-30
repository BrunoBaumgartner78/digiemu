"use client";
import React, { useEffect, useState, useCallback } from "react";
import type { ReviewDTO } from "@/types/ui";

export default function Reviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");

  const reload = useCallback(async () => {
    const response = await fetch(`/api/products/${productId}/reviews`);
    const json: unknown = await response.json().catch(() => null);
    if (Array.isArray(json)) setReviews(json as ReviewDTO[]);
    else setReviews([]);
  }, [productId]);

  // Submit review (minimal payload per docs/community_v1.yaml)
  async function submit() {
    const safeRating = Math.min(5, Math.max(1, Math.floor(Number(rating) || 1)));

    await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "product_review",
        visibility: "public",
        rating: safeRating,
        content: content.trim() || undefined,
      }),
    });

    setContent("");
    await reload();
  }

  // IMPORTANT: fetch inline, don't call reload() here
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/products/${productId}/reviews`);
        const json: unknown = await response.json().catch(() => null);

        if (cancelled) return;

        if (Array.isArray(json)) setReviews(json as ReviewDTO[]);
        else setReviews([]);
      } catch {
        if (!cancelled) setReviews([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <div className="mt-8">
      <h3 className="font-semibold text-lg mb-3">Bewertungen (1�5 Sterne)</h3>

      {reviews.length > 0 && (
        <div className="space-y-3 mb-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-3 bg-white border rounded shadow"
              data-visibility="public"
              data-type="product_review"
            >
              <div className="font-bold">{r.rating} ?</div>
              {r.content && <div>{r.content}</div>}
            </div>
          ))}
        </div>
      )}

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="border p-2 rounded mb-2"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} Sterne
          </option>
        ))}
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="p-2 border rounded w-full mb-2"
        placeholder="Bewertung schreiben�"
      />

      <button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">
        Bewertung speichern
      </button>
    </div>
  );
}
