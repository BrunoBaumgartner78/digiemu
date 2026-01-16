export type NeonAccent = "cyan" | "violet" | "emerald" | "rose" | "amber";

// Stabil pro Tag + optional pro Route
export function pickDailyAccent(seed: string = ""): NeonAccent {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${seed}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const accents: NeonAccent[] = ["cyan", "violet", "emerald", "rose", "amber"];
  return accents[h % accents.length];
}

// Minimal, bewusst klein gehalten (du kannst später erweitern)
export function getFooterSpecial(now = new Date()): { emoji: string; label: string } | null {
  const m = now.getMonth() + 1;
  const d = now.getDate();

  // Neujahr
  if (m === 1 && (d === 1 || d === 2)) return { emoji: "✨", label: "Neujahr" };
  // Valentinstag
  if (m === 2 && d === 14) return { emoji: "💗", label: "Valentinstag" };
  // Halloween
  if (m === 10 && d === 31) return { emoji: "🎃", label: "Halloween" };
  // Advent/Weihnachten (vereinfacht: 24–26.12)
  if (m === 12 && (d === 24 || d === 25 || d === 26)) return { emoji: "🎄", label: "Weihnachten" };
  // Silvester
  if (m === 12 && d === 31) return { emoji: "🥂", label: "Silvester" };

  return null;
}
