"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./DownloadsFilters.module.css";

type Item = { id: string; label: string };

const MIN_LEN = 2;

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { cache: "no-store", signal });
  const txt = await r.text();
  if (!r.ok) {
    let msg = txt;
    try {
      const j = JSON.parse(txt);
      msg = (j?.error || j?.message || txt) as string;
    } catch {}
    throw new Error(`${r.status} ${r.statusText}: ${msg}`);
  }
  return JSON.parse(txt) as T;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function DownloadsFilters(props: {
  from?: string;
  to?: string;
  productId?: string;
  vendorId?: string;
  buyerId?: string;
  pageSize: number;
}) {
  const [productQ, setProductQ] = useState("");
  const [vendorQ, setVendorQ] = useState("");
  const [buyerQ, setBuyerQ] = useState("");

  const [productId, setProductId] = useState(props.productId ?? "");
  const [vendorId, setVendorId] = useState(props.vendorId ?? "");
  const [buyerId, setBuyerId] = useState(props.buyerId ?? "");

  const [productItems, setProductItems] = useState<Item[]>([]);
  const [vendorItems, setVendorItems] = useState<Item[]>([]);
  const [buyerItems, setBuyerItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState(props.from ?? "");
  const [to, setTo] = useState(props.to ?? "");
  const [pageSize, setPageSize] = useState(String(props.pageSize));

  const loadProducts = useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.trim().length < MIN_LEN) {
          setProductItems([]);
          return;
        }
        const ac = new AbortController();
        try {
          setError(null);
          const data = await fetchJSON<{ items: Item[] }>(
            `/api/admin/lookup/products?q=${encodeURIComponent(q)}&take=20`,
            ac.signal
          );
          setProductItems(data.items);
        } catch (e: any) {
          if (e?.name === "AbortError") return;
          setError(e?.message ?? "Lookup products failed");
          setProductItems([]);
        }
      }, 200),
    []
  );

  const loadVendors = useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.trim().length < MIN_LEN) {
          setVendorItems([]);
          return;
        }
        const ac = new AbortController();
        try {
          setError(null);
          const data = await fetchJSON<{ items: Item[] }>(
            `/api/admin/lookup/users?role=VENDOR&q=${encodeURIComponent(q)}&take=20`,
            ac.signal
          );
          setVendorItems(data.items);
        } catch (e: any) {
          if (e?.name === "AbortError") return;
          setError(e?.message ?? "Lookup vendors failed");
          setVendorItems([]);
        }
      }, 200),
    []
  );

  const loadBuyers = useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.trim().length < MIN_LEN) {
          setBuyerItems([]);
          return;
        }
        const ac = new AbortController();
        try {
          setError(null);
          const data = await fetchJSON<{ items: Item[] }>(
            `/api/admin/lookup/users?role=BUYER&q=${encodeURIComponent(q)}&take=20`,
            ac.signal
          );
          setBuyerItems(data.items);
        } catch (e: any) {
          if (e?.name === "AbortError") return;
          setError(e?.message ?? "Lookup buyers failed");
          setBuyerItems([]);
        }
      }, 200),
    []
  );

  useEffect(() => void loadProducts(productQ), [productQ, loadProducts]);
  useEffect(() => void loadVendors(vendorQ), [vendorQ, loadVendors]);
  useEffect(() => void loadBuyers(buyerQ), [buyerQ, loadBuyers]);

  return (
    <form className={styles.fForm} action="/admin/downloads" method="get">
      {/* Hidden IDs */}
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="vendorId" value={vendorId} />
      <input type="hidden" name="buyerId" value={buyerId} />
      {/* ✅ Text-Fallback Filter (wenn keine ID gewählt wurde) */}
      <input type="hidden" name="productQ" value={productQ} />
      <input type="hidden" name="vendorQ" value={vendorQ} />
      <input type="hidden" name="buyerQ" value={buyerQ} />

      <div className={styles.fGrid}>
        <label className={styles.fField}>
          <span className={styles.fLabel}>From</span>
          <input className={styles.fInput} name="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="YYYY-MM-DD" />
        </label>

        <label className={styles.fField}>
          <span className={styles.fLabel}>To</span>
          <input className={styles.fInput} name="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="YYYY-MM-DD" />
        </label>

        <label className={styles.fField}>
          <span className={styles.fLabel}>Page size</span>
          <input className={styles.fInput} name="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)} />
        </label>
      </div>

      {/* Product */}
      <div className={styles.fField}>
        <span className={styles.fLabel}>Produkt suchen</span>
        <div className={styles.fRow}>
            <input
            name="productQ"
            className={styles.fInput}
            value={productQ}
            onChange={(e) => {
              setProductQ(e.target.value);
              setProductId("");
            }}
            placeholder="Titel tippen…"
          />
          <button className={`${styles.fBtn} ${styles.fBtnGhost}`} type="button" onClick={() => { setProductQ(""); setProductId(""); setProductItems([]); }}>
            Clear
          </button>
        </div>

        {productItems.length > 0 && (
          <div className={styles.fSuggest}>
            {productItems.map((it) => (
              <button
                key={it.id}
                className={styles.fSuggestBtn}
                type="button"
                onClick={() => {
                  setProductId(it.id);
                  setProductQ(it.label);
                  setProductItems([]);
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}

        {productId && <div className={styles.fHint}>Selected: <span className={styles.fPill}>{productId}</span></div>}
      </div>

      {/* Vendor */}
      <div className={styles.fField}>
        <span className={styles.fLabel}>Vendor suchen</span>
        <div className={styles.fRow}>
          <input
            name="vendorQ"
            className={styles.fInput}
            value={vendorQ}
            onChange={(e) => {
              setVendorQ(e.target.value);
              setVendorId("");
            }}
            placeholder="E-Mail oder Name…"
          />
          <button className={`${styles.fBtn} ${styles.fBtnGhost}`} type="button" onClick={() => { setVendorQ(""); setVendorId(""); setVendorItems([]); }}>
            Clear
          </button>
        </div>

        {vendorItems.length > 0 && (
          <div className={styles.fSuggest}>
            {vendorItems.map((it) => (
              <button
                key={it.id}
                className={styles.fSuggestBtn}
                type="button"
                onClick={() => {
                  setVendorId(it.id);
                  setVendorQ(it.label);
                  setVendorItems([]);
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}

        {vendorId && <div className={styles.fHint}>Selected: <span className={styles.fPill}>{vendorId}</span></div>}
      </div>

      {/* Buyer */}
      <div className={styles.fField}>
        <span className={styles.fLabel}>Buyer suchen</span>
        <div className={styles.fRow}>
          <input
            name="buyerQ"
            className={styles.fInput}
            value={buyerQ}
            onChange={(e) => {
              setBuyerQ(e.target.value);
              setBuyerId("");
            }}
            placeholder="E-Mail oder Name…"
          />
          <button className={`${styles.fBtn} ${styles.fBtnGhost}`} type="button" onClick={() => { setBuyerQ(""); setBuyerId(""); setBuyerItems([]); }}>
            Clear
          </button>
        </div>

        {buyerItems.length > 0 && (
          <div className={styles.fSuggest}>
            {buyerItems.map((it) => (
              <button
                key={it.id}
                className={styles.fSuggestBtn}
                type="button"
                onClick={() => {
                  setBuyerId(it.id);
                  setBuyerQ(it.label);
                  setBuyerItems([]);
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}

        {buyerId && <div className={styles.fHint}>Selected: <span className={styles.fPill}>{buyerId}</span></div>}
      </div>

      <div className={styles.fActions}>
        <button className={`${styles.fBtn} ${styles.fBtnPrimary}`} type="submit">
          Filter
        </button>
        <a className={styles.fBtn} href="/admin/downloads">
          Reset
        </a>
      </div>
      {error && (
        <div className={styles.fHint}>
          ⚠ {error}
        </div>
      )}
    </form>
  );
}
