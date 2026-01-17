"use client";
import { useState, useEffect } from "react";
import type { CommentDTO } from "@/types/ui";

export default function Comments({ productId }: { productId: string }) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [content, setContent] = useState("");

  async function load() {
    const res = await fetch(`/api/product/${productId}/comments`);
    const json: unknown = await res.json().catch(() => null);
    if (Array.isArray(json)) {
      setComments(json as CommentDTO[]);
    } else {
      setComments([]);
    }
  }

  async function submit() {
    if (!content.trim()) return;
    const res = await fetch(`/api/product/${productId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setContent("");
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-3">Kommentare</h3>

      <div className="flex flex-col gap-3 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-white p-3 rounded shadow border">
            <div className="text-sm text-gray-600">{c.user?.email ?? ""}</div>
            <div>{c.content}</div>
          </div>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(_e) => setContent(_e.target.value)}
        className="p-2 border rounded w-full mb-2"
        placeholder="Kommentar schreiben…"
      />
      <button onClick={submit} className="px-3 py-2 bg-blue-600 text-white rounded">
        Abschicken
      </button>
    </div>
  );
}
