"use client";
import { useState } from "react";

const DUMMY_CATEGORIES = ["Alle", "Design", "Audio", "Video", "Code"];
const DUMMY_PRODUCTS = Array.from({ length: 6 }).map((_, i) => ({
  id: `dummy-${i}`,
  title: `Produkt ${i + 1}`,
  priceCents: 990 + i * 100,
  category: DUMMY_CATEGORIES[i % DUMMY_CATEGORIES.length],
}));

export default function ExplorePage() {
  const [category, setCategory] = useState("Alle");
  const [sort, setSort] = useState("Neu");
  const [price, setPrice] = useState([0, 2000]);

  // Filter- und Sortierlogik (Dummy)
  const filtered = DUMMY_PRODUCTS.filter(p =>
    (category === "Alle" || p.category === category) &&
    p.priceCents >= price[0] && p.priceCents <= price[1]
  );
  const sorted = [...filtered].sort((a, b) => sort === "Neu" ? b.priceCents - a.priceCents : a.priceCents - b.priceCents);

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-[#1F78D1]">Entdecken</h1>
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-2 rounded bg-[#232323] text-white">
          {DUMMY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label className="flex items-center gap-2 text-white">
          Preis:
          <input type="number" value={price[0]} min={0} max={price[1]} onChange={e => setPrice([+e.target.value, price[1]])} className="w-16 px-2 rounded bg-[#232323] text-white" />
          -
          <input type="number" value={price[1]} min={price[0]} max={5000} onChange={e => setPrice([price[0], +e.target.value])} className="w-16 px-2 rounded bg-[#232323] text-white" />
        </label>
        <select value={sort} onChange={e => setSort(e.target.value)} className="px-4 py-2 rounded bg-[#232323] text-white">
          <option value="Neu">Neu</option>
          <option value="Beliebt">Beliebt</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {sorted.map(product => (
          <div key={product.id} className="bg-[#232323] rounded-lg p-6 flex flex-col items-start shadow text-white">
            <h2 className="font-semibold text-xl mb-2">{product.title}</h2>
            <div className="mb-2 text-[#39FF14] font-bold">{(product.priceCents / 100).toFixed(2)} €</div>
            <div className="mb-4 text-sm text-gray-400">{product.category}</div>
            <button className="px-4 py-2 rounded bg-[#1F78D1] text-white font-semibold mt-auto">Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}
