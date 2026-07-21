import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  BadgeCheck,
  Globe,
  Megaphone,
  Moon,
  Navigation,
  Phone,
} from "lucide-react";
import { fetchPharmacyBySlug } from "@/lib/api";
import {
  ANNOUNCEMENT_LABELS,
  DAY_NAMES,
  navigationUrl,
} from "@/lib/format";
import { OpenBadge } from "@/components/OpenBadge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MapView } from "@/components/map/MapView";
import { Reveal } from "@/components/ui/Reveal";
import type { PharmacyDetail } from "@/lib/types";

// ISR: strona budowana na żądanie, cache 1h, rewalidacja on-demand po synchronizacji/publikacji.
export const revalidate = 3600;

const getPharmacy = cache(fetchPharmacyBySlug);

function warsawTodayDow(): number {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = ymd.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPharmacy(slug);
  if (!p) return { title: "Apteka nie znaleziona" };

  const todayDow = warsawTodayDow();
  const todayHours = p.weekHours[todayDow]?.segments ?? [];
  const hoursStr = todayHours.length
    ? todayHours.map((h) => (h.is24h ? "całą dobę" : `${h.opens}–${h.closes}`)).join(", ")
    : "godziny niepodane";

  return {
    title: `${p.name} – ${p.address.city}, ${p.address.street}`,
    description: `${p.name}, ${p.address.street}, ${p.address.postalCode} ${p.address.city}. Godziny dziś: ${hoursStr}. Dystans, dojazd i status otwarcia na otoapteka.pl.`,
    alternates: { canonical: `/apteka/${p.slug}` },
    openGraph: {
      title: `${p.name} – ${p.address.city}`,
      description: `${p.address.street}, ${p.address.postalCode} ${p.address.city}. Godziny dziś: ${hoursStr}.`,
      type: "website",
    },
  };
}

const SCHEMA_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function jsonLd(p: PharmacyDetail) {
  const openingHoursSpecification = p.weekHours.flatMap((w) =>
    w.segments.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[w.dayOfWeek]}`,
      opens: s.is24h ? "00:00" : s.opens,
      closes: s.is24h ? "23:59" : s.closes === "24:00" ? "23:59" : s.closes,
    })),
  );
  return {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: p.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: p.address.street,
      addressLocality: p.address.city,
      postalCode: p.address.postalCode,
      addressRegion: p.address.voivodeship,
      addressCountry: "PL",
    },
    ...(p.lat && p.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } }
      : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.website ? { url: p.website } : {}),
    openingHoursSpecification,
  };
}

export default async function PharmacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPharmacy(slug);
  if (!p) notFound();

  const todayDow = warsawTodayDow();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(p)) }}
      />

      {/* Nagłówek */}
      <div className="rounded-3xl border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-pharma shadow-sm">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="white" aria-hidden>
                <path d="M9.1 2.6h5.8a1.3 1.3 0 0 1 1.3 1.3v5h5a1.3 1.3 0 0 1 1.3 1.3v5.8a1.3 1.3 0 0 1-1.3 1.3h-5v5a1.3 1.3 0 0 1-1.3 1.3H9.1a1.3 1.3 0 0 1-1.3-1.3v-5h-5a1.3 1.3 0 0 1-1.3-1.3v-5.8a1.3 1.3 0 0 1 1.3-1.3h5v-5a1.3 1.3 0 0 1 1.3-1.3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {p.name}
              </h1>
              <p className="mt-1 text-lg text-ink-soft">
                {p.address.street}, {p.address.postalCode} {p.address.city}
              </p>
              {p.address.voivodeship && (
                <p className="text-sm capitalize text-muted">woj. {p.address.voivodeship}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OpenBadge status={p.openStatus} />
            <FavoriteButton slug={p.slug} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {p.lat && p.lng && (
            <a
              href={navigationUrl(p.lat, p.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <Navigation className="h-4.5 w-4.5" aria-hidden /> Nawiguj
            </a>
          )}
          {p.phone && (
            <a
              href={`tel:${p.phone.replace(/\s+/g, "")}`}
              className="pressable inline-flex items-center gap-2 rounded-xl border-2 border-line px-5 py-3 font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
            >
              <Phone className="h-4.5 w-4.5" aria-hidden /> {p.phone}
            </a>
          )}
          {p.website && (
            <a
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex items-center gap-2 rounded-xl border-2 border-line px-5 py-3 font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
            >
              <Globe className="h-4.5 w-4.5" aria-hidden /> Strona www
            </a>
          )}
        </div>
      </div>

      {/* Mapa */}
      {p.lat && p.lng && (
        <div className="mt-4 h-72 overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]">
          <MapView
            center={{ lat: p.lat, lng: p.lng }}
            zoom={15}
            markers={[{ lat: p.lat, lng: p.lng, name: p.name, highlight: true }]}
          />
        </div>
      )}

      {/* Godziny tygodnia */}
      <Reveal as="section" className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-lg font-bold text-ink">Godziny otwarcia</h2>
        <div className="divide-y">
          {p.weekHours.map((w) => {
            const isToday = w.dayOfWeek === todayDow;
            return (
              <div
                key={w.dayOfWeek}
                className={`flex items-center justify-between py-2.5 ${
                  isToday
                    ? "-mx-3 rounded-xl border-y-0 bg-pharma-soft px-3 font-bold text-ink"
                    : "text-ink-soft"
                }`}
              >
                <span className={isToday ? "" : "font-medium"}>
                  {DAY_NAMES[w.dayOfWeek]}
                  {isToday && (
                    <span className="ml-2 rounded-full bg-pharma px-2 py-0.5 text-xs font-bold text-white">
                      dziś
                    </span>
                  )}
                </span>
                <span className={`text-lg tabular-nums ${isToday ? "text-pharma-dark" : ""}`}>
                  {w.segments.length === 0
                    ? "—"
                    : w.segments
                        .map((s) => (s.is24h ? "całą dobę" : `${s.opens}–${s.closes}`))
                        .join(", ")}
                </span>
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* Dyżury */}
      {p.dutyShifts.length > 0 && (
        <Reveal as="section" className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
            <Moon className="h-5 w-5 text-primary" aria-hidden /> Dyżury
          </h2>
          <ul className="space-y-2 text-ink-soft">
            {p.dutyShifts.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                {new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(d.startsAt))}
                {" – "}
                {new Intl.DateTimeFormat("pl-PL", { timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(d.endsAt))}
                {d.note && <span className="text-muted">· {d.note}</span>}
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* Info z apteki */}
      {p.announcements.length > 0 && (
        <Reveal as="section" className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
            <Megaphone className="h-5 w-5 text-pharma" aria-hidden /> Info z apteki
          </h2>
          <div className="space-y-4">
            {p.announcements.map((a) => (
              <article key={a.id} className="rounded-xl bg-bg p-4">
                <span className="inline-block rounded-full bg-pharma-soft px-2.5 py-0.5 text-xs font-bold text-pharma-dark">
                  {ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}
                </span>
                <h3 className="mt-1.5 font-bold text-ink">{a.title}</h3>
                <p className="mt-1 whitespace-pre-line text-ink-soft">{a.body}</p>
              </article>
            ))}
          </div>
        </Reveal>
      )}

      {/* Usługi / dodatkowe */}
      {p.profile && (p.profile.services.length > 0 || p.profile.prescriptionPickup || p.profile.description) && (
        <Reveal as="section" className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-lg font-bold text-ink">Usługi i informacje</h2>
          {p.profile.description && <p className="mb-3 text-ink-soft">{p.profile.description}</p>}
          {p.profile.prescriptionPickup && (
            <p className="mb-2 inline-flex items-center gap-2 rounded-lg bg-pharma-soft px-3 py-1.5 text-sm font-bold text-pharma-dark">
              <BadgeCheck className="h-4 w-4" aria-hidden /> Odbiór recept
            </p>
          )}
          {p.profile.services.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {p.profile.services.map((s, i) => (
                <li key={i} className="rounded-full border bg-bg px-3 py-1.5 text-sm font-medium text-ink">
                  {s.name}
                  {s.note && <span className="text-muted"> · {s.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      )}
    </div>
  );
}
