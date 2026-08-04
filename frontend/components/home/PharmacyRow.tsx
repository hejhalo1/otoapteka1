import Link from "next/link";
import { Car, ChevronRight, Footprints, Megaphone } from "lucide-react";
import type { PharmacyCard, OpenState } from "@/lib/types";
import {
  ANNOUNCEMENT_LABELS,
  formatDistance,
  formatMinutes,
  formatTime,
} from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PharmacyMonogram } from "@/components/PharmacyMonogram";
import { cn } from "@/lib/utils";

export type TravelMode = "walk" | "drive";

/** Metryka dojścia: ikona + wartość + podpis; aktywny tryb dostaje zielony akcent. */
function Metric({
  Icon,
  main,
  sub,
  active,
  iconClass,
}: {
  Icon: typeof Footprints;
  main: string;
  sub: string;
  active: boolean;
  iconClass?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-300",
        active ? "bg-pharma-soft" : "bg-transparent",
      )}
    >
      <Icon
        className={cn("h-5 w-5 shrink-0", active ? "text-pharma-dark" : "text-ink-soft", iconClass)}
        strokeWidth={2}
        aria-hidden
      />
      <div className="leading-tight">
        <div className="text-sm font-bold tabular-nums text-ink">{main}</div>
        <div className="text-[11px] text-muted">{sub}</div>
      </div>
    </div>
  );
}

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

/**
 * Karta-wiersz apteki wg mockupu: numer ↔ pin na mapie, kafelek sieci, adres,
 * metryki pieszo/autem, status CAPS + duże godziny, dolny pasek „Info z apteki”.
 */
export function PharmacyRow({
  pharmacy,
  index,
  mode,
  onHover,
}: {
  pharmacy: PharmacyCard;
  index: number;
  mode: TravelMode;
  onHover?: (id: string | null) => void;
}) {
  const p = pharmacy;
  const s = p.openStatus;
  const meta = STATUS_META[s.state];

  const hoursStr =
    p.hoursForDate.length === 0
      ? "—"
      : p.hoursForDate
          .map((h) => (h.is24h ? "0:00 – 24:00" : `${h.opens} – ${h.closes}`))
          .join(", ");

  // Duża wartość po prawej: przy „zamyka się wkrótce” godzina zamknięcia (mockup),
  // w pozostałych stanach godziny wybranego dnia.
  const caps =
    s.state === "CLOSING_SOON" && s.closesAt
      ? `Zamyka się za ${minutesUntil(s.closesAt)} min`
      : meta.caps;
  const bigValue =
    s.state === "CLOSING_SOON" && s.closesAt ? formatTime(s.closesAt) : hoursStr;

  return (
    <Link
      href={`/apteka/${p.slug}`}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(p.id)}
      onBlur={() => onHover?.(null)}
      className="card-hover card-accent animate-card-in group relative block rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]"
      style={{ animationDelay: `${Math.min(index - 1, 8) * 45}ms` }}
    >
      {/* Numer korespondujący z pinem na mapie (dekoracyjny — treść czyta się z nazwy). */}
      <span
        aria-hidden
        className="absolute -left-2.5 -top-2.5 z-10 grid h-8 w-8 place-items-center rounded-xl bg-pharma text-sm font-extrabold text-white shadow-[var(--shadow-card)] transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:scale-110 group-hover:bg-ink"
      >
        {index}
      </span>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <PharmacyMonogram name={p.name} className="h-24 w-28 text-2xl sm:h-[104px] sm:w-32" />

        <div className="min-w-0 flex-1 basis-48">
          <h3 className="truncate text-lg font-extrabold text-ink">{p.name}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {p.address.street}, {p.address.postalCode} {p.address.city}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Metric
              Icon={Footprints}
              main={formatDistance(p.distanceMeters)}
              sub={`${formatMinutes(p.walkMinutes)} pieszo`}
              active={mode === "walk"}
              iconClass="stat-walk"
            />
            <Metric
              Icon={Car}
              main={formatMinutes(p.driveMinutes)}
              sub={`${formatDistance(p.distanceMeters)} autem`}
              active={mode === "drive"}
              iconClass="stat-car"
            />
          </div>
        </div>

        <div className="shrink-0 text-right sm:min-w-36">
          <div className={cn("text-xs font-extrabold uppercase tracking-wide", meta.cls)}>
            {caps}
          </div>
          <div
            className={cn("mt-1 text-2xl font-extrabold tabular-nums tracking-tight", meta.big)}
            title={hoursStr}
          >
            {bigValue}
          </div>
        </div>
      </div>

      {/* Dolny pasek: info z apteki (albo neutralne CTA) + serce + chevron */}
      <div className="mt-3.5 flex items-center gap-2 border-t pt-3">
        {p.latestAnnouncement ? (
          <>
            <Megaphone className="h-4 w-4 shrink-0 text-pharma" aria-hidden />
            <span className="text-sm font-bold text-pharma-dark">Info z apteki:</span>
            <span className="min-w-0 truncate text-sm text-ink-soft">
              {ANNOUNCEMENT_LABELS[p.latestAnnouncement.type] ?? "Komunikat"}
              {" — "}
              {p.latestAnnouncement.title}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted">Zobacz szczegóły apteki</span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <FavoriteButton slug={p.slug} className="h-8 w-8" />
          <ChevronRight className="chev h-5 w-5 text-muted" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
