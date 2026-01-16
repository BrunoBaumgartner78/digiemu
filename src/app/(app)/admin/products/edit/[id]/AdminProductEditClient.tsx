"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InitialProduct = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  fileUrl: string;
  thumbnail: string;
  category: string;
  isActive: boolean;
  status: "ACTIVE" | "DRAFT" | "BLOCKED";
  moderationNote: string;
  vendorEmail: string;
  vendorIsBlocked: boolean;
  createdAtISO: string;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("de-CH");
  } catch {
    return iso;
  }
}

export default function AdminProductEditClient({
  initialProduct,
}: {
  initialProduct: InitialProduct;
}) {
  const router = useRouter();

  const [title, setTitle] = useState<string>(initialProduct.title ?? "");
  const [description, setDescription] = useState<string>(
    initialProduct.description ?? ""
  );

  const initialPriceCHF = useMemo(() => {
    const chf = (initialProduct.priceCents ?? 0) / 100;
    return chf.toFixed(2);
  }, [initialProduct.priceCents]);

  const [priceChf, setPriceChf] = useState<string>(initialPriceCHF);
  const [thumbnail, setThumbnail] = useState<string>(initialProduct.thumbnail ?? "");
  const [category, setCategory] = useState<string>(initialProduct.category ?? "other");
  const [status, setStatus] = useState<InitialProduct["status"]>(
    (initialProduct.status as any) ?? "DRAFT"
  );
  const [isActive, setIsActive] = useState<boolean>(!!initialProduct.isActive);
  const [moderationNote, setModerationNote] = useState<string>(
    initialProduct.moderationNote ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const createdAtLabel = useMemo(
    () => fmtDate(initialProduct.createdAtISO),
    [initialProduct.createdAtISO]
  );

  function normalizeCHF(v: string): number {
    const s = String(v ?? "").replace(",", ".").trim();
    return Number(s);
  }

  async function onSave() {
    setError(null);
    setOk(null);

    if (!title.trim()) return setError("Titel fehlt.");
    if (!description.trim()) return setError("Beschreibung fehlt.");

    const chf = normalizeCHF(priceChf);
    if (!Number.isFinite(chf)) return setError("Preis ist ungültig.");

    const cents = Math.round(chf * 100);
    if (cents < 100) return setError("Mindestpreis ist 1.00 CHF.");

    // BLOCKED => niemals aktiv
    const finalIsActive = status === "BLOCKED" ? false : isActive;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${initialProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceCents: cents,
          thumbnail: thumbnail.trim() || null,
          category: category.trim() || "other",
          status,
          isActive: finalIsActive,
          moderationNote: moderationNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Speichern fehlgeschlagen.");

      setOk("Gespeichert.");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  const vendorBadge = initialProduct.vendorIsBlocked
    ? { text: "Vendor gesperrt", cls: "bg-rose-500/10 text-rose-400" }
    : { text: "Vendor aktiv", cls: "bg-emerald-500/10 text-emerald-500" };

  const statusBadge =
    status === "ACTIVE"
      ? { text: "ACTIVE", cls: "bg-emerald-500/10 text-emerald-500" }
      : status === "BLOCKED"
      ? { text: "BLOCKED", cls: "bg-rose-500/10 text-rose-400" }
      : { text: "DRAFT", cls: "bg-slate-500/10 text-slate-300" };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-[var(--text-muted)]">Admin · Produkt bearbeiten</div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="text-sm text-[var(--text-main)] font-semibold truncate">
                {initialProduct.vendorEmail}
              </div>

              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${vendorBadge.cls}`}>
                {vendorBadge.text}
              </span>

              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${statusBadge.cls}`}>
                {statusBadge.text}
              </span>
            </div>

            <div className="mt-2 text-xs text-[var(--text-muted)]">
              Produkt-ID: <span className="font-mono">{initialProduct.id}</span>
              <span className="mx-2 opacity-40">•</span>
              Erstellt: {createdAtLabel}
            </div>
          </div>

          <div className="flex gap-2 md:justify-end">
            <button
              type="button"
              className="neobtn-sm ghost"
              onClick={() => router.push("/admin/products")}
              disabled={saving}
            >
              ← Zurück
            </button>

            <button type="button" className="neobtn-sm" onClick={onSave} disabled={saving}>
              {saving ? "Speichere…" : "Speichern"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Titel</label>
              <input className="input-neu w-full" value={title} onChange={(_e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Beschreibung</label>
              <textarea
                className="input-neu w-full"
                style={{ minHeight: 160, resize: "vertical" }}
                value={description}
                onChange={(_e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Kategorie</label>
                <input className="input-neu w-full" value={category} onChange={(_e) => setCategory(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Preis (CHF) — Mindestpreis 1.00
                </label>
                <input
                  className="input-neu w-full"
                  type="number"
                  step="0.05"
                  min="1"
                  value={priceChf}
                  onChange={(_e) => setPriceChf(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Moderation Note (nur Admin)</label>
              <textarea
                className="input-neu w-full"
                style={{ minHeight: 100, resize: "vertical" }}
                value={moderationNote}
                onChange={(_e) => setModerationNote(e.target.value)}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-[var(--neo-card-border)] bg-[var(--neo-card-bg-soft)] shadow-[var(--neo-card-shadow-soft)] p-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">Status & Sichtbarkeit</div>

              <label className="block text-xs text-[var(--text-muted)] mb-1">Status</label>
              <select
                className="input-neu w-full"
                value={status}
                onChange={(_e) => {
                  const v = e.target.value as InitialProduct["status"];
                  setStatus(v);

                  // ✅ OnChange Fix: wenn ACTIVE gewählt wird, automatisch sichtbar machen
                  if (v === "ACTIVE") setIsActive(true);
                  if (v === "BLOCKED") setIsActive(false);
                }}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>

              <div className="mt-3 flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  disabled={status === "BLOCKED"}
                  onChange={(_e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" className="text-xs text-[var(--text-muted)]">
                  isActive (Marketplace-Sichtbarkeit)
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--neo-card-border)] bg-[var(--neo-card-bg-soft)] shadow-[var(--neo-card-shadow-soft)] p-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">Thumbnail</div>

              <label className="block text-xs text-[var(--text-muted)] mb-1">Thumbnail URL (optional)</label>
              <input className="input-neu w-full" value={thumbnail} onChange={(_e) => setThumbnail(e.target.value)} />

              <div className="mt-3 rounded-2xl overflow-hidden border border-[var(--neo-card-border)] bg-[var(--bg-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail || "/fallback-thumbnail.svg"}
                  alt="Thumbnail"
                  style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                  loading="lazy"
                  decoding="async"
                  onError={(_e) => {
                    e.currentTarget.src = "/fallback-thumbnail.svg";
                  }}
                />
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <a className="neobtn-sm ghost" href={initialProduct.fileUrl} target="_blank" rel="noreferrer">
                  Datei öffnen
                </a>
                <button type="button" className="neobtn-sm" disabled={saving} onClick={onSave}>
                  {saving ? "Speichere…" : "Speichern"}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {(error || ok) && (
          <div className="mt-4">
            {error && <div className="text-sm text-rose-300">{error}</div>}
            {ok && !error && <div className="text-sm text-emerald-300">{ok}</div>}
          </div>
        )}
      </section>
    </div>
  );
}
