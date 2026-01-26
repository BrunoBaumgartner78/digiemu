"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./comments.module.css";
import { badgeLabel } from "@/lib/comments/badges";

type CommentItem = {
  id: string;
  text: string;
  createdAt?: string;
  authorName?: string | null;
  badges?: string[];
  likesCount?: number;
  viewerHasLiked?: boolean;
};

function normalize(raw: any): CommentItem | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? "").trim();
  const text = String(raw.text ?? raw.content ?? raw.message ?? "").trim();
  if (!id || !text) return null;

  const createdAt =
    typeof raw.createdAt === "string"
      ? raw.createdAt
      : raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : undefined;

  const authorName =
    typeof raw.authorName === "string"
      ? raw.authorName
      : typeof raw.user?.name === "string"
        ? raw.user.name
        : null;

  const badges = Array.isArray(raw.badges) ? raw.badges.filter(Boolean).map(String) : [];
  const likesCount = typeof raw.likesCount === "number" ? raw.likesCount : 0;
  const viewerHasLiked = !!raw.viewerHasLiked;

  return { id, text, createdAt, authorName, badges, likesCount, viewerHasLiked };
}

export default function CommentsClient({
  productId,
  className,
  initialCount,
}: {
  productId: string;
  className?: string;
  initialCount?: number;
}) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(initialCount);

  const [sort, setSort] = useState<"new" | "top">("new");
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [posting, setPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>("");

  const baseEndpoint = useMemo(
    () => `/api/products/${encodeURIComponent(productId)}/comments`,
    [productId]
  );
  const likeEndpoint = useMemo(
    () => `/api/products/${encodeURIComponent(productId)}/comments/like`,
    [productId]
  );

  async function load(opts?: { reset?: boolean }) {
    const reset = opts?.reset !== false;

    if (reset) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseEndpoint}?sort=${encodeURIComponent(sort)}&take=20`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`GET comments failed (${res.status})`);
        const data = await res.json();

        const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const normalized = arr.map(normalize).filter(Boolean) as CommentItem[];

        setItems(normalized);
        setTotalCount(typeof data?.count === "number" ? data.count : normalized.length);
        setNextCursor(typeof data?.nextCursor === "string" ? data.nextCursor : null);
      } catch (e: any) {
        setError(e?.message ?? "Fehler beim Laden der Kommentare.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // load more
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(
        `${baseEndpoint}?sort=${encodeURIComponent(sort)}&take=20&cursor=${encodeURIComponent(nextCursor)}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) throw new Error(`GET comments (more) failed (${res.status})`);
      const data = await res.json();

      const arr = Array.isArray(data?.items) ? data.items : [];
      const normalized = arr.map(normalize).filter(Boolean) as CommentItem[];

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const n of normalized) if (!seen.has(n.id)) merged.push(n);
        return merged;
      });

      // count from server stays the truth
      if (typeof data?.count === "number") setTotalCount(data.count);
      setNextCursor(typeof data?.nextCursor === "string" ? data.nextCursor : null);
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Laden weiterer Kommentare.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit() {
    const msg = text.trim();
    if (!msg) return;

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(baseEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`POST comment failed (${res.status}) ${t}`.trim());
      }

      const data = await res.json().catch(() => null);
      const created = normalize(data?.comment ?? data);
      setText("");

      if (created) {
        setItems((prev) => [created, ...prev]);
        setTotalCount((c) => (typeof c === "number" ? c + 1 : undefined));
      } else {
        await load({ reset: true });
      }
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Senden.");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(commentId: string) {
    // optimistic UI
    setItems((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const liked = !c.viewerHasLiked;
        const delta = liked ? 1 : -1;
        return {
          ...c,
          viewerHasLiked: liked,
          likesCount: Math.max(0, (c.likesCount ?? 0) + delta),
        };
      })
    );

    try {
      const res = await fetch(likeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (!res.ok) throw new Error(`Like failed (${res.status})`);

      const data = await res.json().catch(() => null);
      const likesCount = typeof data?.likesCount === "number" ? data.likesCount : undefined;
      const viewerHasLiked = typeof data?.viewerHasLiked === "boolean" ? data.viewerHasLiked : undefined;

      if (typeof likesCount === "number" || typeof viewerHasLiked === "boolean") {
        setItems((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likesCount: typeof likesCount === "number" ? likesCount : c.likesCount,
                  viewerHasLiked: typeof viewerHasLiked === "boolean" ? viewerHasLiked : c.viewerHasLiked,
                }
              : c
          )
        );
      }
    } catch (e) {
      // revert on error
      setItems((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const liked = !c.viewerHasLiked;
          const delta = liked ? 1 : -1;
          return {
            ...c,
            viewerHasLiked: liked,
            likesCount: Math.max(0, (c.likesCount ?? 0) + delta),
          };
        })
      );
    }
  }

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseEndpoint, sort]);

  return (
    <section className={className ?? ""}>
      <div className={styles.headerRow}>
        <div className={styles.titleRow}>
          <h2 className={styles.h2}>Community</h2>
          <div className={styles.countPill}>
            💬 {typeof totalCount === "number" ? totalCount : items.length} Kommentare
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.sortGroup}>
            <button
              type="button"
              className={`${styles.sortBtn} ${sort === "new" ? styles.sortBtnActive : ""}`}
              onClick={() => setSort("new")}
              disabled={loading}
            >
              Neu
            </button>
            <button
              type="button"
              className={`${styles.sortBtn} ${sort === "top" ? styles.sortBtnActive : ""}`}
              onClick={() => setSort("top")}
              disabled={loading}
            >
              Top
            </button>
          </div>

          <button type="button" className="neobtn" onClick={() => load({ reset: true })} disabled={loading}>
            ↻ Aktualisieren
          </button>
        </div>
      </div>

      <div className="neo-card" style={{ padding: 14, marginTop: 12 }}>
        <label className={styles.label}>Kommentar schreiben</label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Was denkst du zu diesem Produkt?"
          className={styles.textarea}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button type="button" className="neobtn" onClick={submit} disabled={posting || !text.trim()}>
            {posting ? "Sende..." : "Kommentar senden"}
          </button>
        </div>

        {error ? <div className={styles.error}>⚠️ {error}</div> : null}
      </div>

      <div className="neo-card" style={{ padding: 14, marginTop: 12 }}>
        {loading ? (
          <div style={{ opacity: 0.75 }}>Lade Kommentare…</div>
        ) : items.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Noch keine Kommentare – sei der/die Erste 🙂</div>
        ) : (
          <div className={styles.list}>
            {items.map((c) => (
              <div key={c.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800 }}>{c.authorName ?? "User"}</div>

                    {Array.isArray(c.badges) && c.badges.length > 0 ? (
                      <div className={styles.badgeRow}>
                        {c.badges.map((b) => (
                          <div key={b} className={`${styles.badgePill} ${styles.badgeMuted}`}>
                            <span className={styles.badgeIcon}>•</span>
                            <span>{badgeLabel(b as any)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.metaRight}>
                      <button
                        type="button"
                        className={styles.likeBtn}
                        onClick={() => toggleLike(c.id)}
                        aria-label={c.viewerHasLiked ? "Like entfernen" : "Like"}
                        title={c.viewerHasLiked ? "Like entfernen" : "Like"}
                      >
                        <span className={styles.likeIcon}>{c.viewerHasLiked ? "♥" : "♡"}</span>
                        <span className={styles.likeCount}>{typeof c.likesCount === "number" ? c.likesCount : 0}</span>
                      </button>

                    {c.createdAt ? (
                      <div className={styles.dateText}>{new Date(c.createdAt).toLocaleString("de-CH")}</div>
                    ) : null}
                  </div>
                </div>

                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{c.text}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && nextCursor ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <button
              type="button"
              className="neobtn"
              onClick={() => load({ reset: false })}
              disabled={loadingMore}
            >
              {loadingMore ? "Lade…" : "Mehr laden"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
