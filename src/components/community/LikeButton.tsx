"use client";
import { useState } from "react";
import type { LikeResponse } from "@/types/ui";

export default function LikeButton({ productId, initialLiked }: { productId: string; initialLiked?: boolean }) {
  const [liked, setLiked] = useState<boolean>(Boolean(initialLiked));

  async function toggle() {
    const res = await fetch(`/api/product/${productId}/like`, {
      method: "POST"
    });
    const json: unknown = await res.json().catch(() => null);
    const data = (json as LikeResponse) ?? { liked: false };
    setLiked(Boolean(data.liked));
  }

  return (
    <button
      onClick={toggle}
      className={`px-3 py-1 rounded-lg border shadow 
      ${liked ? "bg-red-500 text-white" : "bg-white"}`}
    >
      {liked ? "♥ Gefällt mir" : "♡ Like"}
    </button>
  );
}
