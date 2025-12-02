"use client";
import { useState } from "react";

export default function LikeButton({ productId, initialLiked }: any) {
  const [liked, setLiked] = useState(initialLiked);

  async function toggle() {
    const res = await fetch(`/api/product/${productId}/like`, {
      method: "POST"
    });
    const data = await res.json();
    setLiked(data.liked);
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
