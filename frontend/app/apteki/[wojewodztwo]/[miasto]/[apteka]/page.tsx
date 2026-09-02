import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import {
  Activity,
  BadgeCheck,
  Calendar,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Clock,
  FlaskConical,
  Globe,
  HeartPulse,
  Info,
  type LucideIcon,
  Mail,
  MapPin,
  Megaphone,
  Moon,
  PackageCheck,
  Phone,
  Pill,
  Sparkles,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { fetchPharmacyBySlug } from "@/lib/api";
import { DAY_NAMES, formatTime } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PharmacyGallery } from "@/components/pharmacy/PharmacyGallery";
import { PharmacyDetailMap } from "@/components/pharmacy/PharmacyDetailMap";
import { NavigateButton } from "@/components/pharmacy/NavigateButton";
import { DetailActions } from "@/components/pharmacy/DetailActions";
import { pharmacyPath, slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
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

function warsawDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function ddmm(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}.${m}`;
}
// „otwarcie dziś/jutro/w poniedziałek o 08:00" — z ISO opensNextAt (strefa Warszawa).
function opensNextLabel(iso: string, today: string, tomorrow: string): string {
  const ds = warsawDateStr(new Date(iso));
  const t = formatTime(iso);
  if (ds === today) return `dziś o ${t}`;
  if (ds === tomorrow) return `jutro o ${t}`;
  const [y, m, d] = ds.split("-").map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return `w ${DAY_NAMES[dow].toLowerCase()} o ${t}`;
}

function announcementIcon(type: string) {
  switch (type) {
    case "VACCINATION":
      return Syringe;
    case "SCREENING":
      return HeartPulse;
    case "CONSULTATION":
      return Stethoscope;
    case "HOURS_CHANGE":
      return Clock;
    case "NEW_SERVICE":
      return Sparkles;
    case "PRODUCT_INFO":
      return Pill;
    case "EVENT":
      return Calendar;
    default:
      return Megaphone;
  }
}
function serviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("szczepien")) return Syringe;
  if (n.includes("ciśnien") || n.includes("cisnien")) return HeartPulse;
  if (n.includes("test") || n.includes("diagnost") || n.includes("badan")) return FlaskConical;
  if (n.includes("przegląd") || n.includes("przeglad") || n.includes("lekow")) return ClipboardList;
  if (n.includes("rezerwac") || n.includes("odbi")) return PackageCheck;
  return Activity;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wojewodztwo: string; miasto: string; apteka: string }>;
}): Promise<Metadata> {
  const { apteka } = await params;
  const p = await getPharmacy(apteka);
  if (!p) return { title: "Apteka nie znaleziona" };

  const todayDow = warsawTodayDow();
  const todayHours = p.weekHours[todayDow]?.segments ?? [];
  const hoursStr = todayHours.length
    ? todayHours.map((h) => (h.is24h ? "całą dobę" : `${h.opens}–${h.closes}`)).join(", ")
    : "godziny niepodane";

  return {
    title: `${p.name} – ${p.address.city}, ${p.address.street}`,
    description: `${p.name}, ${p.address.street}, ${p.address.postalCode} ${p.address.city}. Godziny dziś: ${hoursStr}. Dystans, dojazd i status otwarcia na otoapteka.pl.`,
    alternates: { canonical: pharmacyPath(p.address.voivodeship, p.address.city, p.slug) },
    openGraph: {
      title: `${p.name} – ${p.address.city}`,
      description: `${p.address.street}, ${p.address.postalCode} ${p.address.city}. Godziny dziś: ${hoursStr}.`,
      type: "website",
    },
  };
}

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  params: Promise<{ wojewodztwo: string; miasto: string; apteka: string }>;
}) {
  const { wojewodztwo, miasto, apteka } = await params;
  const p = await getPharmacy(apteka);
  if (!p) notFound();

  // Slug apteki rozstrzyga; woj./miasto to część czytelna. Gdy nie pasują do
  // faktycznego adresu (stary link, literówka) → 1 kanoniczny URL (SEO).
  const canonical = pharmacyPath(p.address.voivodeship, p.address.city, p.slug);
  if (`/apteki/${wojewodztwo}/${miasto}/${apteka}` !== canonical) redirect(canonical);

  const todayDow = warsawTodayDow();
  const today = warsawDateStr(new Date());
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const dutyLabel = (iso: string) => {
    const ds = warsawDateStr(new Date(iso));
    return ds === today ? "Dziś" : ds === tomorrow ? "Jutro" : ddmm(ds);
  };
  const relDay = (iso: string | null) => {
    if (!iso) return "";
    const ds = warsawDateStr(new Date(iso));
    return ds === today ? "dzisiaj" : ds === yesterday ? "wczoraj" : ddmm(ds);
  };

  const photos = p.profile?.photos ?? [];
  const services = p.profile?.services ?? [];
  const duties = p.dutyShifts.slice(0, 4);

  // ── Wyliczone, realne informacje (spójny „stan" apteki) ──
  const todaySegs = p.weekHours.find((w) => w.dayOfWeek === todayDow)?.segments ?? [];
  const todayHoursStr = todaySegs.length
    ? todaySegs.map((s) => (s.is24h ? "całą dobę" : `${s.opens}–${s.closes}`)).join(", ")
    : "nieczynne";
  const openDays = p.weekHours.filter((w) => w.segments.length > 0).length;
  const has24h = p.weekHours.some((w) => w.segments.some((s) => s.is24h));
  const sundayOpen = (p.weekHours.find((w) => w.dayOfWeek === 6)?.segments.length ?? 0) > 0;
  const isDuty = p.openStatus.isDuty;
  const hasDuty = isDuty || p.dutyShifts.length > 0;
  const wojHref = `/apteki/${slugify(p.address.voivodeship)}`;
  const cityHref = `/apteki/${slugify(p.address.voivodeship)}/${slugify(p.address.city)}`;

  // Status apteki — słowo + szczegół + kolory akcentu.
  const st = p.openStatus.state;
  const stateWord =
    st === "OPEN"
      ? "Otwarte"
      : st === "CLOSING_SOON"
        ? "Zamyka się wkrótce"
        : st === "CLOSED"
          ? "Zamknięte"
          : "Godziny nieznane";
  const statusDetail =
    (st === "OPEN" || st === "CLOSING_SOON") && p.openStatus.closesAt
      ? `czynne do ${formatTime(p.openStatus.closesAt)}`
      : st === "CLOSED" && p.openStatus.opensNextAt
        ? `otwarcie ${opensNextLabel(p.openStatus.opensNextAt, today, tomorrow)}`
        : "";
  const statusAccent =
    st === "OPEN"
      ? "border-open bg-open/[0.06]"
      : st === "CLOSING_SOON"
        ? "border-warn bg-warn/[0.06]"
        : st === "CLOSED"
          ? "border-danger bg-danger/[0.06]"
          : "border-line bg-bg";
  const statusDot =
    st === "OPEN" ? "bg-open" : st === "CLOSING_SOON" ? "bg-warn" : st === "CLOSED" ? "bg-danger" : "bg-muted";
  const statusText =
    st === "OPEN"
      ? "text-open"
      : st === "CLOSING_SOON"
        ? "text-warn"
        : st === "CLOSED"
          ? "text-danger"
          : "text-muted";

  // Chipy „faktów" — realne cechy z danych apteki.
  const chips: { icon: LucideIcon; label: string }[] = [];
  if (has24h) chips.push({ icon: Clock, label: "Czynna całą dobę" });
  else if (openDays === 7) chips.push({ icon: CalendarCheck, label: "Czynne 7 dni w tygodniu" });
  else if (sundayOpen) chips.push({ icon: CalendarCheck, label: "Czynne w niedzielę" });
  if (hasDuty) chips.push({ icon: Moon, label: "Pełni dyżury nocne" });
  if (p.profile?.prescriptionPickup) chips.push({ icon: BadgeCheck, label: "Odbiór recept" });

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[92rem] px-4 py-6 sm:py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(p)) }}
        />

        {/* Całość zamknięta w jednej sekcji — tło leciutko ciemniejsze niż biały. */}
        <div className="rounded-lg border border-line bg-bg p-3 shadow-[var(--shadow-card)] sm:p-6">
          {/* Breadcrumb (osadza wizytówkę w katalogu) + akcje */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Ścieżka nawigacji" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
              <Link href="/apteki" className="hover:text-pharma hover:underline">
                Apteki
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <Link href={wojHref} className="capitalize hover:text-pharma hover:underline">
                {p.address.voivodeship}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <Link href={cityHref} className="hover:text-pharma hover:underline">
                {p.address.city}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <span className="font-semibold text-ink-soft">{p.name}</span>
            </nav>
            <DetailActions title={p.name} />
          </div>

          {/* Dyżur teraz — mocna, konkretna informacja */}
          {isDuty && (
            <div className="mb-5 flex items-center gap-3 rounded-md border border-pharma/25 bg-pharma-soft px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-pharma text-white">
                <Moon className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-pharma-dark">
                Ta apteka pełni teraz dyżur
                {p.openStatus.closesAt ? ` — czynne do ${formatTime(p.openStatus.closesAt)}` : ""}.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* ── SEKCJA 1: karta „hero" — galeria · tożsamość · mapa ── */}
            <section className="rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.9fr)]">
                <PharmacyGallery photos={photos} name={p.name} />

                <div className="flex min-w-0 flex-col">
                  <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-ink sm:text-[2.6rem]">
                    {p.name}
                  </h1>
                  <p className="mt-2.5 flex items-start gap-1.5 text-ink-soft">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-pharma" aria-hidden />
                    <span>
                      <span className="text-[17px]">
                        {p.address.street}, {p.address.postalCode} {p.address.city}
                      </span>
                      <span className="block text-sm capitalize text-muted">
                        {p.address.county ? `powiat ${p.address.county} · ` : ""}woj. {p.address.voivodeship}
                      </span>
                    </span>
                  </p>

                  {/* Status + dzisiejsze godziny — serce wizytówki */}
                  <div className={cn("mt-4 rounded-md border-l-4 px-4 py-3", statusAccent)}>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", statusDot)} aria-hidden />
                        <span className={cn("text-lg font-black", statusText)}>{stateWord}</span>
                      </span>
                      {statusDetail && (
                        <span className="text-sm font-semibold text-ink-soft">· {statusDetail}</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-ink-soft">
                      Dziś ({DAY_NAMES[todayDow].toLowerCase()}):{" "}
                      <span className="font-bold tabular-nums text-ink">{todayHoursStr}</span>
                    </div>
                  </div>

                  {/* Chipy faktów */}
                  {chips.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {chips.map((c, i) => {
                        const CIcon = c.icon;
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm font-semibold text-ink-soft"
                          >
                            <CIcon className="h-4 w-4 text-pharma" aria-hidden />
                            {c.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Opis apteki (realny, jeśli podany) */}
                  {p.profile?.description && (
                    <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                      {p.profile.description}
                    </p>
                  )}

                  {/* Kontakt / akcje — tuż pod informacjami (zwięźle, bez rozpychania) */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-5">
                    {p.phone && (
                      <a
                        href={`tel:${p.phone.replace(/\s+/g, "")}`}
                        className="pressable inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
                      >
                        <Phone className="h-4.5 w-4.5" aria-hidden /> {p.phone}
                      </a>
                    )}
                    {p.lat && p.lng && (
                      <NavigateButton
                        lat={p.lat}
                        lng={p.lng}
                        className="pressable inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
                      />
                    )}
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pressable inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
                      >
                        <Globe className="h-4.5 w-4.5" aria-hidden /> Strona www
                      </a>
                    )}
                    {p.profile?.email && (
                      <a
                        href={`mailto:${p.profile.email}`}
                        className="pressable inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
                      >
                        <Mail className="h-4.5 w-4.5" aria-hidden /> E-mail
                      </a>
                    )}
                    <FavoriteButton slug={p.slug} />
                  </div>
                </div>

                {p.lat && p.lng ? (
                  <PharmacyDetailMap lat={p.lat} lng={p.lng} name={p.name} />
                ) : (
                  <div className="grid h-64 place-items-center rounded-lg border border-line bg-bg text-muted lg:h-[340px]">
                    Brak lokalizacji na mapie
                  </div>
                )}
              </div>
            </section>

      {/* ── SEKCJA 2: Info z apteki · Dyżury · Godziny — jedna spójna karta z podziałkami ── */}
      <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="grid divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Info z apteki */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-pharma-soft text-pharma-dark">
              <Info className="h-4.5 w-4.5" aria-hidden />
            </span>
            <h2 className="text-lg font-black text-ink">Info z apteki</h2>
          </div>
          {p.announcements.length === 0 ? (
            <p className="text-sm text-muted">Brak komunikatów.</p>
          ) : (
            <ul className="space-y-4">
              {p.announcements.slice(0, 6).map((a) => {
                const AIcon = announcementIcon(a.type);
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pharma-soft text-pharma-dark">
                      <AIcon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="truncate font-bold text-ink">{a.title}</h3>
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {relDay(a.publishedAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{a.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Dyżury */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e0722f]/15 text-[#c2410c]">
              <Moon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <h2 className="text-lg font-black text-ink">Dyżury</h2>
          </div>
          {duties.length === 0 ? (
            <p className="text-sm text-muted">Ta apteka nie ma zaplanowanych dyżurów.</p>
          ) : (
            <ul className="space-y-4">
              {duties.map((d, i) => (
                <li key={i}>
                  <div className="text-sm font-bold text-ink-soft">{dutyLabel(d.startsAt)} dyżur:</div>
                  <div className="mt-0.5 text-xl font-black tabular-nums text-pharma-dark">
                    {formatTime(d.startsAt)} – {formatTime(d.endsAt)}
                  </div>
                  {d.note && <div className="mt-0.5 text-sm text-muted">{d.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Godziny otwarcia */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-pharma-soft text-pharma-dark">
              <Clock className="h-4.5 w-4.5" aria-hidden />
            </span>
            <h2 className="text-lg font-black text-ink">Godziny otwarcia</h2>
          </div>
          <div className="divide-y divide-line">
            {p.weekHours.map((w) => {
              const isToday = w.dayOfWeek === todayDow;
              const hours =
                w.segments.length === 0
                  ? "Nieczynne"
                  : w.segments
                      .map((s) => (s.is24h ? "całą dobę" : `${s.opens} – ${s.closes}`))
                      .join(", ");
              return (
                <div
                  key={w.dayOfWeek}
                  className={`flex items-center justify-between py-2.5 text-[15px] ${
                    isToday ? "font-black text-ink" : "font-medium text-ink-soft"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {DAY_NAMES[w.dayOfWeek]}
                    {isToday && (
                      <span className="rounded-md bg-pharma px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        dziś
                      </span>
                    )}
                  </span>
                  <span className={`tabular-nums ${isToday ? "text-pharma-dark" : ""}`}>{hours}</span>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </section>

      {/* ── SEKCJA 3: Usługi w aptece ── */}
      {services.length > 0 && (
        <section className="rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="mb-5 text-lg font-black text-ink">Usługi w aptece</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {services.map((s, i) => {
              const SIcon = serviceIcon(s.name);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2.5 rounded-md border border-line bg-bg px-3 py-5 text-center"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-pharma-soft text-pharma-dark">
                    <SIcon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-ink">{s.name}</span>
                  {s.note && <span className="text-xs text-muted">{s.note}</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
