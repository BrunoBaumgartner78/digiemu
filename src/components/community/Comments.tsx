"use client";
import React, { useEffect, useState, useCallback } from "react";
import type { CommentDTO } from "@/types";

export default function Comments({ productId }: { productId: string }) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [content, setContent] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch(`/api/products/${productId}/comments`);
    const json: unknown = await response.json().catch(() => null);
    if (Array.isArray(json)) setComments(json as CommentDTO[]);
    else setComments([]);
  }, [productId]);

  // Submit comment (minimal payload per docs/community_v1.yaml)
  async function submit() {
    if (!content.trim()) return;

    await fetch(`/api/products/${productId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "product_comment",
        visibility: "public",
        content: content.trim(),
      }),
    });

    setContent("");
    await reload();
  }

  // IMPORTANT: do not call reload() from useEffect (eslint react-hooks/set-state-in-effect)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/products/${productId}/comments`);
        const json: unknown = await response.json().catch(() => null);

        if (cancelled) return;

        if (Array.isArray(json)) setComments(json as CommentDTO[]);
        else setComments([]);
      } catch {
        if (!cancelled) setComments([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-3">Kommentare</h3>

      <div className="flex flex-col gap-3 mb-4">
        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-white p-3 rounded shadow border"
            data-visibility="public"
            data-type="product_comment"
          >
            <div className="text-sm text-gray-600">{c.user?.email ?? ""}</div>
            <div>{c.content}</div>
          </div>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="p-2 border rounded w-full mb-2"
        placeholder="Kommentar schreiben…"
      />
      <button onClick={submit} className="px-3 py-2 bg-blue-600 text-white rounded">
        Abschicken
      </button>
    </div>
  );
}
