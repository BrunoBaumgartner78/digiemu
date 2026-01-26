"use client";
import React, { useEffect, useState } from "react";

type User = { id: string; name?: string | null } | null;
type Review = { id: string; rating: number; content?: string | null; createdAt: string; user: User };

export default function ReviewsClient({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [items, setItems] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();
      setAvg(Number(data.avgRating ?? 0));
      setCount(Number(data.count ?? 0));
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content: content || null }),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      await load();
      setContent("");
    } catch (err) {
      console.error(err);
      alert("Konnte Bewertung nicht speichern.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="neo-card" style={{ padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Bewertungen</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarRow value={avg} />
          <div style={{ fontSize: 13, opacity: 0.8 }}>{avg.toFixed(2)} · {count} Bewertungen</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div style={{ opacity: 0.6 }}>Lade Bewertungen…</div>
        ) : (
          items.map((r) => (
            <div key={r.id} style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong>{r.user?.name ?? "Anonym"}</strong>
                <StarRow value={r.rating} />
                <span style={{ fontSize: 12, opacity: 0.6 }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.content ? <div style={{ marginTop: 6, opacity: 0.9 }}>{r.content}</div> : null}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13 }}>Deine Bewertung</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} Sterne`}
                className={n <= rating ? "neobtn active" : "neobtn"}
                style={{ padding: '6px 8px' }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Optional: kurze Rückmeldung"
            rows={3}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button className="neobtn primary" type="submit" disabled={submitting}>
            {submitting ? "Speichern…" : "Bewertung abgeben"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StarRow({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div style={{ color: "#ffb400", display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 14, opacity: i <= full ? 1 : 0.35 }}>★</span>
      ))}
    </div>
  );
}
