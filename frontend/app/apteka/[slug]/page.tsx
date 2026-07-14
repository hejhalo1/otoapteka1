import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchPharmacyBySlug } from "@/lib/api";
import {
  ANNOUNCEMENT_LABELS,
  DAY_NAMES,
  navigationUrl,
} from "@/lib/format";
import { OpenBadge } from "@/components/OpenBadge";
import { MapView } from "@/components/map/MapView";
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
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{p.name}</h1>
            <p className="mt-1 text-lg text-ink-soft">
              {p.address.street}, {p.address.postalCode} {p.address.city}
            </p>
            {p.address.voivodeship && (
              <p className="text-sm capitalize text-muted">woj. {p.address.voivodeship}</p>
            )}
          </div>
          <OpenBadge status={p.openStatus} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {p.lat && p.lng && (
            <a
              href={navigationUrl(p.lat, p.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable rounded-xl bg-teal px-5 py-3 font-semibold text-surface hover:bg-teal-dark"
            >
              🧭 Nawiguj
            </a>
          )}
          {p.phone && (
            <a
              href={`tel:${p.phone.replace(/\s+/g, "")}`}
              className="pressable rounded-xl border-2 border-line px-5 py-3 font-semibold text-ink hover:border-teal hover:text-teal"
            >
              📞 {p.phone}
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
      <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-lg font-bold text-ink">Godziny otwarcia</h2>
        <div className="divide-y">
          {p.weekHours.map((w) => {
            const isToday = w.dayOfWeek === todayDow;
            return (
              <div
                key={w.dayOfWeek}
                className={`flex items-center justify-between py-2.5 ${isToday ? "font-bold text-ink" : "text-ink-soft"}`}
              >
                <span className={isToday ? "" : "font-medium"}>
                  {DAY_NAMES[w.dayOfWeek]}
                  {isToday && <span className="ml-2 rounded bg-teal/10 px-2 py-0.5 text-xs text-teal">dziś</span>}
                </span>
                <span className="text-lg tabular-nums">
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
      </section>

      {/* Dyżury */}
      {p.dutyShifts.length > 0 && (
        <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-lg font-bold text-ink">Dyżury</h2>
          <ul className="space-y-2 text-ink-soft">
            {p.dutyShifts.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <span aria-hidden>🌙</span>
                {new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(d.startsAt))}
                {" – "}
                {new Intl.DateTimeFormat("pl-PL", { timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(d.endsAt))}
                {d.note && <span className="text-muted">· {d.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Info z apteki */}
      {p.announcements.length > 0 && (
        <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-lg font-bold text-ink">Info z apteki</h2>
          <div className="space-y-4">
            {p.announcements.map((a) => (
              <article key={a.id} className="rounded-xl bg-bg p-4">
                <span className="inline-block rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-semibold text-violet">
                  {ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}
                </span>
                <h3 className="mt-1.5 font-bold text-ink">{a.title}</h3>
                <p className="mt-1 whitespace-pre-line text-ink-soft">{a.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Usługi / dodatkowe */}
      {p.profile && (p.profile.services.length > 0 || p.profile.prescriptionPickup || p.profile.description) && (
        <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-lg font-bold text-ink">Usługi i informacje</h2>
          {p.profile.description && <p className="mb-3 text-ink-soft">{p.profile.description}</p>}
          {p.profile.prescriptionPickup && (
            <p className="mb-2 inline-flex items-center gap-2 rounded-lg bg-open/10 px-3 py-1.5 text-sm font-medium text-open">
              ✓ Odbiór recept
            </p>
          )}
          {p.profile.services.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {p.profile.services.map((s, i) => (
                <li key={i} className="rounded-full border bg-bg px-3 py-1.5 text-sm text-ink">
                  {s.name}
                  {s.note && <span className="text-muted"> · {s.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
