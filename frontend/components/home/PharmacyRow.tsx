import Link from "next/link";
import { ArrowRight, Car, Footprints, MapPin, MoonStar } from "lucide-react";
import type { PharmacyCard, OpenState } from "@/lib/types";
import { ANNOUNCEMENT_LABELS, formatDistance, formatMinutes } from "@/lib/format";
import { pharmacyPath } from "@/lib/slug";
import { PharmacyTile } from "@/components/PharmacyTile";
import { cn } from "@/lib/utils";

// Ciemniejsze warianty barw statusu — kontrast AA dla drobnego, pogrubionego tekstu.
const STATUS_META: Record<OpenState, { caps: string; cls: string; big: string }> = {
  OPEN: { caps: "Otwarte", cls: "text-[#15803d]", big: "text-[#15803d]" },
  CLOSING_SOON: { caps: "Zamyka się wkrótce", cls: "text-[#c2410c]", big: "text-[#c2410c]" },
  CLOSED: { caps: "Zamknięte", cls: "text-[#b91c1c]", big: "text-ink" },
  UNKNOWN: { caps: "Godziny nieznane", cls: "text-muted", big: "text-ink" },
};

function minutesUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
}

// Dyżur do sekcji pomarańczowej: dwie linijki (data + zakres godzin) lub null.
function formatDuty(duty: PharmacyCard["duty"]): { date: string; time: string } | null {
  if (!duty) return null;
  const s = new Date(duty.startsAt);
  const e = new Date(duty.endsAt);
  const day = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(s);
  const t = (d: Date) =>
    new Intl.DateTimeFormat("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    }).format(d);
  return { date: day, time: `${t(s)}–${t(e)}` };
}

/**
 * Karta-wiersz apteki: kafelek, nazwa/adres, jedna odległość + czasy, po prawej
 * status/godziny, a na całą wysokość pomarańczowa sekcja „Dyżur" (godziny lub „–").
 *
 * `live` = wybrany dzień to dzisiaj → status liczony „na żywo”; inaczej stałe godziny.
 */
export function PharmacyRow({
  pharmacy,
  index,
  live,
  onHover,
}: {
  pharmacy: PharmacyCard;
  index: number;
  live: boolean;
  onHover?: (id: string | null) => void;
}) {
  const p = pharmacy;
  const s = p.openStatus;
  const meta = STATUS_META[s.state];

  const hasHours = p.hoursForDate.length > 0;
  const hoursStr = hasHours
    ? p.hoursForDate
        .map((h) => (h.is24h ? "0:00 – 24:00" : `${h.opens} – ${h.closes}`))
        .join(", ")
    : "Nieczynne";

  const capsText = live
    ? s.state === "CLOSING_SOON" && s.closesAt
      ? `Zamyka się za ${minutesUntil(s.closesAt)} min`
      : meta.caps
    : "Godziny";
  // Zawsze pełny zakres godzin (np. „8:00 – 20:00”), także gdy „zamyka się wkrótce”
  // — wcześniej pokazywało tylko godzinę zamknięcia.
  const bigText = hoursStr;
  const capsCls = live ? meta.cls : "text-muted";
  const bigCls = live ? meta.big : hasHours ? "text-ink" : "text-muted";

  const duty = formatDuty(p.duty);

  return (
    <Link
      href={pharmacyPath(p.address.voivodeship, p.address.city, p.slug)}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(p.id)}
      onBlur={() => onHover?.(null)}
      className="card-hover animate-card-in group relative flex min-w-0 overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-card)]"
      style={{ animationDelay: `${Math.min(index - 1, 8) * 45}ms` }}
    >
        {/* ŚRODEK: treść karty */}
        <div className="relative min-w-0 flex-1 p-3 sm:p-4">
        {/* Numer korespondujący z pinem na mapie (wewnątrz — overflow-hidden go nie utnie). */}
        <span
          aria-hidden
          className="absolute left-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-lg bg-pharma text-xs font-extrabold text-white shadow-[var(--shadow-card)] transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:scale-110 group-hover:bg-ink"
        >
          {index}
        </span>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 sm:gap-x-5 sm:gap-y-3">
          <PharmacyTile className="h-20 w-24 sm:h-[104px] sm:w-32" />

          <div className="min-w-0 flex-1 basis-40 sm:basis-44">
            <h3 className="truncate text-lg font-extrabold text-ink">{p.name}</h3>
            <p className="mt-0.5 truncate text-sm text-muted">
              {p.address.street}, {p.address.postalCode} {p.address.city}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* JEDNA odległość — wspólna dla dojścia i dojazdu. */}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-pharma-soft px-2.5 py-1 text-sm font-extrabold tabular-nums text-pharma-dark">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
                {formatDistance(p.distanceMeters)}
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Footprints className="h-4 w-4 shrink-0" aria-hidden />
                  {formatMinutes(p.walkMinutes)}
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Car className="h-4 w-4 shrink-0" aria-hidden />
                  {formatMinutes(p.driveMinutes)}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0 text-left sm:min-w-32">
            <div className={cn("text-xs font-extrabold uppercase tracking-wide", capsCls)}>
              {capsText}
            </div>
            <div
              className={cn("mt-1 text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl", bigCls)}
              title={hoursStr}
            >
              {bigText}
            </div>
          </div>
        </div>

        {/* Dolny pasek: znaczek „i” + info z apteki (na mobile do 2 linijek),
            po prawej okrągła strzałka „Karta apteki”. */}
        <div className="mt-3 flex items-start gap-2 border-t pt-2.5 sm:items-center sm:pt-3">
          <span
            aria-hidden
            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pharma-dark text-[11px] font-black leading-none text-white sm:mt-0"
          >
            i
          </span>
          <p className="min-w-0 flex-1 text-sm leading-snug text-pharma-dark">
            {p.latestAnnouncement ? (
              <span className="line-clamp-2 sm:line-clamp-1">
                <span className="font-bold">Info z apteki: </span>
                {ANNOUNCEMENT_LABELS[p.latestAnnouncement.type] ?? "Komunikat"}
                {": "}
                {p.latestAnnouncement.title}
              </span>
            ) : (
              <span className="font-semibold">Informacje o aptece</span>
            )}
          </p>
          {/* Zamiast przycisku — okrągła strzałka; po najechaniu na kafelek rozwija się
              w lewo z napisem „Karta apteki", żeby było jasne, że klik przenosi dalej. */}
          <span
            title="Karta apteki"
            className="flex shrink-0 items-center rounded-full bg-pharma p-2 text-sm font-bold text-white shadow-sm transition-colors duration-300 group-hover:bg-pharma-dark"
          >
            <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr]">
              <span className="min-w-0 overflow-hidden whitespace-nowrap pl-1 pr-1.5">Karta apteki</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
          </span>
        </div>
      </div>

      {/* PRAWA kolumna: sekcja dyżuru — niebieska gdy jest dyżur, szara gdy brak. */}
      <div
        className={cn(
          "flex w-20 shrink-0 flex-col items-center justify-center gap-1 px-2 py-3 text-center text-white sm:w-24",
          duty ? "bg-pharma" : "bg-muted",
        )}
      >
        <MoonStar className="h-5 w-5" aria-hidden />
        <div className="text-[10px] font-extrabold uppercase leading-tight tracking-wide">
          Dyżur
        </div>
        {duty ? (
          <div className="leading-tight">
            <div className="text-[11px] font-semibold tabular-nums opacity-90">{duty.date}</div>
            <div className="text-sm font-extrabold tabular-nums">{duty.time}</div>
          </div>
        ) : (
          <div className="text-lg font-extrabold leading-none">–</div>
        )}
      </div>
      </Link>
  );
}
