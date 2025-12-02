"use client";
import { useEffect, useState } from "react";

export default function Reviews({ productId }: any) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  async function load() {
    const res = await fetch(`/api/product/${productId}/reviews`);
    setReviews(await res.json());
  }

  async function submit() {
    const res = await fetch(`/api/product/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content })
    });
    setContent("");
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mt-8">
      <h3 className="font-semibold text-lg mb-3">
        Bewertungen (1–5 Sterne)
      </h3>

      {reviews.length > 0 && (
        <div className="space-y-3 mb-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-3 bg-white border rounded shadow">
              <div className="font-bold">{r.rating} ★</div>
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
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Sterne</option>)}
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="p-2 border rounded w-full mb-2"
        placeholder="Bewertung schreiben…"
      />

      <button
        onClick={submit}
        className="px-3 py-2 bg-green-600 text-white rounded"
      >
        Bewertung speichern
      </button>
    </div>
  );
}
