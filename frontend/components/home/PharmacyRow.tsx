import Link from "next/link";
import { Car, ChevronRight, Footprints, MapPin, MoonStar } from "lucide-react";
import type { PharmacyCard, OpenState } from "@/lib/types";
import { ANNOUNCEMENT_LABELS, formatDistance, formatMinutes } from "@/lib/format";
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
      href={`/apteka/${p.slug}`}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(p.id)}
      onBlur={() => onHover?.(null)}
      className="card-hover animate-card-in group relative flex min-w-0 overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-card)]"
      style={{ animationDelay: `${Math.min(index - 1, 8) * 45}ms` }}
    >
        {/* ŚRODEK: treść karty */}
        <div className="relative min-w-0 flex-1 p-4">
        {/* Numer korespondujący z pinem na mapie (wewnątrz — overflow-hidden go nie utnie). */}
        <span
          aria-hidden
          className="absolute left-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-lg bg-pharma text-xs font-extrabold text-white shadow-[var(--shadow-card)] transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:scale-110 group-hover:bg-ink"
        >
          {index}
        </span>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PharmacyTile className="h-24 w-28 sm:h-[104px] sm:w-32" />

          <div className="min-w-0 flex-1 basis-44">
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
              className={cn("mt-1 text-2xl font-extrabold tabular-nums tracking-tight", bigCls)}
              title={hoursStr}
            >
              {bigText}
            </div>
          </div>
        </div>

        {/* Dolny pasek: znaczek „i” + info z apteki, po prawej przycisk „Karta apteki”. */}
        <div className="mt-3.5 flex items-center gap-2 border-t pt-3">
          <span
            aria-hidden
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pharma-dark text-[11px] font-black leading-none text-white"
          >
            i
          </span>
          {p.latestAnnouncement ? (
            <>
              <span className="shrink-0 text-sm font-bold text-pharma-dark">Info z apteki:</span>
              <span className="min-w-0 truncate text-sm text-pharma-dark">
                {ANNOUNCEMENT_LABELS[p.latestAnnouncement.type] ?? "Komunikat"}
                {" — "}
                {p.latestAnnouncement.title}
              </span>
            </>
          ) : (
            <span className="truncate text-sm font-semibold text-pharma-dark">
              Informacje o aptece
            </span>
          )}
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-pharma px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors duration-200 group-hover:bg-pharma-dark">
            Karta apteki
            <ChevronRight className="chev h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>

      {/* PRAWA kolumna: sekcja dyżuru — pomarańczowa, pełna wysokość, treść wyśrodkowana. */}
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 bg-[#e0722f] px-2 py-3 text-center text-white">
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
