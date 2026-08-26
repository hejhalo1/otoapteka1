import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { fetchCities } from "@/lib/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Apteki w Polsce — baza aptek według województw i miast",
  description:
    "Pełna baza aptek w Polsce. Wybierz województwo i miasto, aby zobaczyć apteki: które są otwarte, godziny, dyżury, dystans i dojazd. otoapteka.pl",
  alternates: { canonical: "/apteki" },
};

function pluralApteki(n: number): string {
  const d = n % 10;
  const s = n % 100;
  if (n === 1) return "apteka";
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return "apteki";
  return "aptek";
}

export default async function AptekiIndexPage() {
  const cities = await fetchCities();

  const byWoj = new Map<
    string,
    { slug: string; name: string; cities: number; pharmacies: number }
  >();
  for (const c of cities) {
    const e = byWoj.get(c.voivodeshipSlug) ?? {
      slug: c.voivodeshipSlug,
      name: c.voivodeship,
      cities: 0,
      pharmacies: 0,
    };
    e.cities += 1;
    e.pharmacies += c.count;
    byWoj.set(c.voivodeshipSlug, e);
  }
  const voivodeships = [...byWoj.values()].sort((a, b) => a.name.localeCompare(b.name, "pl"));
  const totalPharmacies = voivodeships.reduce((s, w) => s + w.pharmacies, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6">
      <nav className="mb-3 text-sm text-muted">
        <span className="font-semibold text-ink-soft">Apteki w Polsce</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
        Apteki w Polsce — baza według województw
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {totalPharmacies.toLocaleString("pl-PL")} {pluralApteki(totalPharmacies)} w{" "}
        {voivodeships.length} województwach. Wybierz województwo, a potem miasto, aby zobaczyć apteki,
        ich godziny otwarcia, dyżury oraz dystans i dojazd.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {voivodeships.map((w) => (
          <li key={w.slug}>
            <Link
              href={`/apteki/${w.slug}`}
              className="card-hover group flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pharma-soft text-pharma-dark">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold capitalize text-ink">{w.name}</span>
                <span className="block text-sm text-muted">
                  {w.cities} {w.cities === 1 ? "miejscowość" : "miejscowości"} ·{" "}
                  {w.pharmacies.toLocaleString("pl-PL")} {pluralApteki(w.pharmacies)}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
