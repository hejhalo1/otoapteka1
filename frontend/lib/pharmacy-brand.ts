// Rozpoznanie sieci aptecznej z nazwy → kolory marki + monogram. Zdjęć aptek nie
// wolno nam brać z zewnątrz, więc kafelek generujemy z barw sieci (np. DOZ =
// pomarańczowo-niebieski). Apteki bez rozpoznanej sieci dostają odcień zieleni.

export interface Brand {
  /** 1–3 znaki na kafelku. */
  initials: string;
  /** Kolory gradientu (od / do) i koloru tekstu. */
  from: string;
  to: string;
  fg: string;
  /** Nazwa sieci (do aria/tytułu), jeśli rozpoznana. */
  chain?: string;
}

interface ChainDef {
  chain: string;
  initials: string;
  from: string;
  to: string;
  fg?: string;
  // Słowa kluczowe (bez znaków diakrytycznych, lowercase) — dopasowanie po nazwie.
  keywords: string[];
}

// Kolory zbliżone do rozpoznawalnych barw sieci (znak towarowy pozostaje ich —
// używamy wyłącznie koloru i inicjałów jako neutralnego oznaczenia).
const CHAINS: ChainDef[] = [
  { chain: "DOZ — Dbam o Zdrowie", initials: "DOZ", from: "#f39200", to: "#0b4ea2", keywords: ["doz", "dbam o zdrowie"] },
  { chain: "Super-Pharm", initials: "SP", from: "#e2001a", to: "#a5000f", keywords: ["super-pharm", "super pharm", "superpharm"] },
  { chain: "Dr.Max", initials: "Dr", from: "#e4032e", to: "#1b3a6b", keywords: ["dr.max", "dr max", "drmax"] },
  { chain: "Gemini", initials: "G", from: "#00a19a", to: "#00726d", keywords: ["gemini"] },
  { chain: "Ziko", initials: "Z", from: "#3aaa35", to: "#1f7a2e", keywords: ["ziko"] },
  { chain: "Cefarm", initials: "CF", from: "#005ca9", to: "#003f75", keywords: ["cefarm"] },
  { chain: "Melissa", initials: "M", from: "#7cb342", to: "#4e7d24", keywords: ["melissa"] },
  { chain: "Świat Zdrowia", initials: "ŚZ", from: "#f39200", to: "#2e7d32", keywords: ["swiat zdrowia"] },
  { chain: "Słoneczna", initials: "S", from: "#fbbf24", to: "#f39200", fg: "#5b3d00", keywords: ["sloneczn"] },
  { chain: "Nowa Farmacja", initials: "NF", from: "#0891b2", to: "#0e7490", keywords: ["nowa farmacja", "apteka nowa"] },
  { chain: "Arnika", initials: "A", from: "#8e44ad", to: "#6c3483", keywords: ["arnika"] },
  { chain: "Panaceum", initials: "P", from: "#0ea5e9", to: "#0369a1", keywords: ["panaceum"] },
  { chain: "Zdrowit", initials: "Zd", from: "#16a34a", to: "#0b7a34", keywords: ["zdrowit"] },
  { chain: "Rodzinna", initials: "R", from: "#ef6c00", to: "#c65200", keywords: ["rodzinna"] },
];

// Odcienie zieleni dla aptek bez rozpoznanej sieci — deterministycznie wg nazwy,
// więc jedna apteka zawsze ma ten sam kolor, a lista jest urozmaicona.
const GREENS: Array<{ from: string; to: string }> = [
  { from: "#279c53", to: "#1e7f42" },
  { from: "#2f9e6b", to: "#1f7a51" },
  { from: "#4a9d3a", to: "#357a27" },
  { from: "#199e7a", to: "#0f7a5e" },
  { from: "#3aa76a", to: "#268050" },
  { from: "#5aa832", to: "#3f7f20" },
];

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l") // ł/Ł nie rozkłada się przez NFD — zamieniamy jawnie
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Inicjały z nazwy z pominięciem słów ogólnych ("Apteka", "Punkt apteczny" itp.).
const STOP = new Set([
  "apteka", "apteki", "punkt", "apteczny", "apteczna", "farmacja", "mgr",
  "farm", "sc", "s", "c", "spolka", "jawna", "z", "o", "sp", "pod", "przy",
  "i", "the", "oraz", "im",
]);

function monogram(name: string): string {
  const words = fold(name)
    .replace(/[„"""'.,()\-/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
  const pick = words.length ? words : fold(name).split(/\s+/).filter(Boolean);
  const letters = pick.slice(0, 2).map((w) => w[0].toUpperCase());
  return letters.join("") || "A";
}

export function brandFor(name: string): Brand {
  const folded = fold(name);
  const chain = CHAINS.find((c) => c.keywords.some((k) => folded.includes(k)));
  if (chain) {
    return {
      initials: chain.initials,
      from: chain.from,
      to: chain.to,
      fg: chain.fg ?? "#ffffff",
      chain: chain.chain,
    };
  }
  const g = GREENS[hash(folded) % GREENS.length];
  return { initials: monogram(name), from: g.from, to: g.to, fg: "#ffffff" };
}
