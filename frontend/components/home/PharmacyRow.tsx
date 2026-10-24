import Link from "next/link";
import { ArrowRight, Car, Footprints, Info, MapPin, MoonStar } from "lucide-react";
import type { PharmacyCard, OpenState } from "@/lib/types";
import { ANNOUNCEMENT_LABELS, formatDistance, formatMinutes } from "@/lib/format";
import { announcementMeta } from "@/lib/announcement-meta";
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

// Dyżur do prawej sekcji: dwie linijki (data + zakres godzin) lub null.
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

/** Kolorowy „chip" komunikatu — ikona kategorii (wizualnie) + skrócony tytuł. */
function AnnouncementChip({ a }: { a: PharmacyCard["announcements"][number] }) {
  const m = announcementMeta(a.type);
  const Icon = m.icon;
  return (
    <span
      className="flex min-w-0 items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-white"
      style={{ backgroundColor: m.color, borderColor: m.color }}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">{ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}: </span>
      <span className="min-w-0 truncate text-xs font-bold sm:text-sm">{a.title}</span>
    </span>
  );
}

/**
 * Karta-wiersz apteki. Hierarchia (od najważniejszego): dyżur (prawa kolumna),
 * odległość (centralny niebieski „badge”), status/godziny, komunikaty apteki
 * (kolorowe chipy z rezerwą miejsca; na hover rozwijają się z opisami).
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
  const bigText = hoursStr;
  const capsCls = live ? meta.cls : "text-muted";
  const bigCls = live ? meta.big : hasHours ? "text-ink" : "text-muted";

  const duty = formatDuty(p.duty);

  const anns = p.announcements;
  // Rozwijana lista (na hover) — gdy jest więcej niż jeden, jest opis, albo tytuł
  // mógłby się nie zmieścić w chipie.
  const showExpand =
    anns.length > 1 || (anns[0] && (Boolean(anns[0].body) || anns[0].title.length > 22));

  return (
    <Link
      href={pharmacyPath(p.address.voivodeship, p.address.city, p.slug)}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(p.id)}
      onBlur={() => onHover?.(null)}
      className="pharmacy-card animate-card-in group relative flex min-w-0 rounded-2xl bg-surface hover:z-10 focus-within:z-10"
      style={{ animationDelay: `${Math.min(index - 1, 8) * 45}ms` }}
    >
      {/* ŚRODEK: treść karty */}
      <div className="relative min-w-0 flex-1 p-2.5 sm:p-3">
        {/* Numer korespondujący z pinem na mapie. */}
        <span
          aria-hidden
          className="absolute left-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-lg bg-pharma text-xs font-extrabold text-white shadow-[var(--shadow-card)] transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:scale-110 group-hover:bg-ink"
        >
          {index}
        </span>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:flex-nowrap sm:gap-x-3">
          <PharmacyTile className="h-14 w-14 sm:h-16 sm:w-16" />

          {/* Tożsamość: nazwa (najważniejsza) + adres (drugorzędny, czytelny) */}
          <div className="min-w-0 flex-1 basis-32">
            <h3 className="truncate text-lg font-black tracking-tight text-ink sm:text-xl">
              {p.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-soft">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              {p.address.street}, {p.address.city}
            </p>
          </div>

          {/* Odległość (centralny „badge”) + status/godziny. Na mobile wchodzą w drugą linię. */}
          <div className="flex items-center gap-2.5 max-sm:w-full max-sm:justify-between sm:gap-3">
            {/* Odległość — kluczowa, wyeksponowana na środku karty (bez tła) */}
            <div className="flex shrink-0 flex-col items-center justify-center px-1 text-center">
              <span className="inline-flex items-center gap-1 text-pharma-dark">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
                <span className="text-2xl font-black leading-none tabular-nums sm:text-[1.75rem]">
                  {formatDistance(p.distanceMeters)}
                </span>
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-pharma-dark/70">
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Footprints className="h-3 w-3" aria-hidden />
                  {formatMinutes(p.walkMinutes)}
                </span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Car className="h-3 w-3" aria-hidden />
                  {formatMinutes(p.driveMinutes)}
                </span>
              </span>
            </div>

            {/* Status + godziny dnia (duże — bardzo ważne) */}
            <div className="shrink-0 text-right sm:text-left">
              <div className={cn("text-xs font-extrabold uppercase tracking-wide", capsCls)}>
                {capsText}
              </div>
              <div
                className={cn(
                  "mt-1 text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl",
                  bigCls,
                )}
                title={hoursStr}
              >
                {bigText}
              </div>
            </div>
          </div>
        </div>

        {/* Strefa komunikatów pod kreską — ciasno, chipy wypełniają szerokość. Na węższych
            ekranach mieści się ich mniej, a licznik „+N" się dostosowuje. Hover → pełna lista. */}
        <div className="mt-2 flex items-center gap-2 border-t pt-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {anns.length === 0 ? (
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Info className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Informacje o aptece
              </span>
            ) : (
              <>
                <AnnouncementChip a={anns[0]} />
                {anns[1] && (
                  <span className="hidden min-w-0 sm:flex">
                    <AnnouncementChip a={anns[1]} />
                  </span>
                )}
                {anns[2] && (
                  <span className="hidden min-w-0 lg:flex">
                    <AnnouncementChip a={anns[2]} />
                  </span>
                )}
                {/* +N na telefonie (widoczny 1 chip) */}
                {anns.length > 1 && (
                  <span className="shrink-0 rounded-[8px] border border-line bg-surface px-2 py-1.5 text-xs font-bold text-ink-soft sm:hidden">
                    +{anns.length - 1}
                  </span>
                )}
                {/* +N na tablecie (widoczne 2 chipy) */}
                {anns.length > 2 && (
                  <span className="hidden shrink-0 rounded-[8px] border border-line bg-surface px-2 py-1.5 text-xs font-bold text-ink-soft sm:inline-flex lg:hidden">
                    +{anns.length - 2}
                  </span>
                )}
              </>
            )}
          </div>

          {/* „Przenośnik" — białe tło, na hover karty delikatnie się podbarwia + nudge w prawo. */}
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition-colors duration-200 [transition-timing-function:var(--ease-out)] group-hover:border-pharma group-hover:bg-pharma-soft group-hover:text-pharma-dark"
          >
            <ArrowRight className="h-4 w-4 transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* Rozwijana lista komunikatów — wychodzi w dół na hover (desktop). Warstwa nad
            kartą (bez przesuwania listy). Pokazuje pełne tytuły i opisy z apteki. */}
        {showExpand && (
          <div className="pointer-events-none absolute left-2 top-full z-30 mt-1 hidden w-1/2 -translate-y-1 rounded-lg border border-line bg-surface p-2 opacity-0 shadow-[var(--shadow-pop)] transition-[opacity,transform] duration-200 [transition-timing-function:var(--ease-out)] group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <p className="px-1 pb-1.5 pt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">
              Komunikaty apteki
            </p>
            <ul className="space-y-1.5">
              {anns.map((a, i) => {
                const m = announcementMeta(a.type);
                const AIcon = m.icon;
                return (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 rounded-[8px] border px-2.5 py-2"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${m.color} 10%, transparent)`,
                      borderColor: `color-mix(in srgb, ${m.color} 10%, transparent)`,
                    }}
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      <AIcon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {/* Opis poziomo, obok tytułu (dużo miejsca w szerokości) */}
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-bold text-ink">{a.title}</span>
                      {a.body && <span className="text-ink-soft"> · {a.body}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* PRAWA kolumna: sekcja dyżuru — niebieska gdy jest dyżur, szara gdy brak. */}
      <div
        className={cn(
          "flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-r-2xl px-2 py-3 text-center text-white sm:w-24",
          duty ? "bg-pharma" : "bg-muted",
        )}
      >
        <MoonStar className="h-5 w-5" aria-hidden />
        <div className="text-[10px] font-extrabold uppercase leading-tight tracking-wide">Dyżur</div>
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
