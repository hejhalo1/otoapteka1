import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight } from "lucide-react";
import { fetchCity, fetchPharmaciesServer } from "@/lib/api";
import { warsawISO } from "@/lib/date";
import { PharmacyResults } from "@/components/home/PharmacyResults";

export const revalidate = 3600;

const getCity = cache(fetchCity);

function pluralApteki(n: number): string {
  const d = n % 10;
  const s = n % 100;
  if (n === 1) return "apteka";
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return "apteki";
  return "aptek";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wojewodztwo: string; miasto: string }>;
}): Promise<Metadata> {
  const { wojewodztwo, miasto } = await params;
  const city = await getCity(wojewodztwo, miasto);
  if (!city) return { title: "Miasto nie znalezione" };
  const title = `Apteki ${city.city} — dyżury, godziny otwarcia, mapa`;
  return {
    title,
    description: `Apteki w mieście ${city.city} (woj. ${city.voivodeship}). ${city.count} ${pluralApteki(city.count)} — sprawdź, która jest teraz otwarta, godziny, dyżury oraz dystans i dojazd.`,
    alternates: { canonical: `/apteki/${city.voivodeshipSlug}/${city.citySlug}` },
    openGraph: { title, type: "website", locale: "pl_PL", siteName: "otoapteka.pl" },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ wojewodztwo: string; miasto: string }>;
}) {
  const { wojewodztwo, miasto } = await params;
  const city = await getCity(wojewodztwo, miasto);
  if (!city) notFound();

  // Dane wstępne (SSR) — pierwsza strona listy, te same domyślne filtry co klient.
  // Pełna baza miasta (openNow=false) — strona ma pokazywać wszystkie apteki, nie
  // tylko akurat otwarte (użytkownik może włączyć „tylko czynne”).
  const initial = await fetchPharmaciesServer({
    lat: city.lat,
    lng: city.lng,
    radiusKm: 50,
    perPage: 10,
    page: 1,
    date: warsawISO(0),
    openNow: false,
    city: city.city,
    voivodeship: city.voivodeship,
  }).catch(() => undefined);

  return (
    <div className="mx-auto max-w-[90rem] px-4 pb-10 pt-6">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/apteki" className="hover:text-pharma">
          Apteki
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href={`/apteki/${city.voivodeshipSlug}`} className="capitalize hover:text-pharma">
          {city.voivodeship}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-semibold text-ink-soft">{city.city}</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Apteki {city.city}</h1>
      <p className="mt-1 max-w-2xl text-muted">
        {city.count} {pluralApteki(city.count)} w mieście {city.city} (woj. {city.voivodeship}).
        Sprawdź, która apteka jest teraz otwarta, godziny, dyżury oraz dystans i dojazd.
      </p>

      <div className="mt-6">
        <PharmacyResults
          center={{ lat: city.lat, lng: city.lng, label: city.city }}
          cityFilter={{ city: city.city, voivodeship: city.voivodeship }}
          initial={initial}
          initialOpenNow={false}
        />
      </div>
    </div>
  );
}
