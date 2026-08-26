import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight } from "lucide-react";
import { fetchCities } from "@/lib/api";

export const revalidate = 3600;

const getCities = cache(fetchCities);

function pluralApteki(n: number): string {
  const d = n % 10;
  const s = n % 100;
  if (n === 1) return "apteka";
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return "apteki";
  return "aptek";
}

async function citiesInVoivodeship(slug: string) {
  const all = await getCities();
  return all
    .filter((c) => c.voivodeshipSlug === slug)
    .sort((a, b) => a.city.localeCompare(b.city, "pl"));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wojewodztwo: string }>;
}): Promise<Metadata> {
  const { wojewodztwo } = await params;
  const cities = await citiesInVoivodeship(wojewodztwo);
  if (cities.length === 0) return { title: "Województwo nie znalezione" };
  const name = cities[0].voivodeship;
  return {
    title: `Apteki — województwo ${name}`,
    description: `Miejscowości w województwie ${name} z aptekami. Wybierz miasto, aby zobaczyć apteki: które są otwarte, godziny, dyżury, dystans i dojazd.`,
    alternates: { canonical: `/apteki/${wojewodztwo}` },
  };
}

export default async function VoivodeshipPage({
  params,
}: {
  params: Promise<{ wojewodztwo: string }>;
}) {
  const { wojewodztwo } = await params;
  const cities = await citiesInVoivodeship(wojewodztwo);
  if (cities.length === 0) notFound();
  const name = cities[0].voivodeship;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/apteki" className="hover:text-pharma">
          Apteki
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-semibold capitalize text-ink-soft">{name}</span>
      </nav>

      <h1 className="text-2xl font-extrabold capitalize text-ink sm:text-3xl">
        Apteki — województwo {name}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {cities.length} {cities.length === 1 ? "miejscowość" : "miejscowości"} z aptekami. Wybierz
        miasto, aby zobaczyć apteki i ich godziny otwarcia.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <li key={c.citySlug}>
            <Link
              href={`/apteki/${c.voivodeshipSlug}/${c.citySlug}`}
              className="card-hover group flex items-center justify-between gap-3 rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <span className="min-w-0">
                <span className="block truncate font-extrabold text-ink">{c.city}</span>
                <span className="block text-sm text-muted">
                  {c.count} {pluralApteki(c.count)}
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
