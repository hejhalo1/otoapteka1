import Link from "next/link";
import { Car, ChevronRight, Footprints, Megaphone } from "lucide-react";
import type { PharmacyCard as Card, OpenState } from "@/lib/types";
import { ANNOUNCEMENT_LABELS, formatDistance, formatMinutes, statusMeta } from "@/lib/format";
import { FavoriteButton } from "./FavoriteButton";
import { cn } from "@/lib/utils";

/** Kafelek z krzyżem aptecznym; apteki całodobowe dostają granatowe „24h”. */
function CrossTile({ is24h }: { is24h: boolean }) {
  if (is24h) {
    return (
      <div className="cross-tile grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-sm font-extrabold tracking-tight text-white shadow-sm">
        24h
      </div>
    );
  }
  return (
    <div className="cross-tile grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pharma shadow-sm">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="white" aria-hidden>
        <path d="M9.1 2.6h5.8a1.3 1.3 0 0 1 1.3 1.3v5h5a1.3 1.3 0 0 1 1.3 1.3v5.8a1.3 1.3 0 0 1-1.3 1.3h-5v5a1.3 1.3 0 0 1-1.3 1.3H9.1a1.3 1.3 0 0 1-1.3-1.3v-5h-5a1.3 1.3 0 0 1-1.3-1.3v-5.8a1.3 1.3 0 0 1 1.3-1.3h5v-5a1.3 1.3 0 0 1 1.3-1.3z" />
      </svg>
    </div>
  );
}

/** Mini-kolumna metryki: ikona + wartość + podpis. */
function Stat({
  Icon,
  value,
  label,
  iconClass,
}: {
  Icon: typeof Footprints;
  value: string;
  label: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cn("h-5 w-5 shrink-0 text-ink-soft", iconClass)}
        strokeWidth={1.9}
        aria-hidden
      />
      <div className="leading-tight">
        <div className="font-bold tabular-nums text-ink">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

const PILL_BY_STATE: Record<OpenState, string> = {
  OPEN: "bg-pharma-soft text-pharma-dark",
  CLOSING_SOON: "bg-warn/10 text-warn",
  CLOSED: "bg-danger/10 text-danger",
  UNKNOWN: "bg-bg text-muted",
};

// Karta apteki — wiersz jak w mockupie: krzyż | nazwa+ulica | dystans | pieszo |
// autem | godziny | info z apteki | serduszko + chevron. Wszystko bez klikania.
export function PharmacyCard({ pharmacy, index = 0 }: { pharmacy: Card; index?: number }) {
  const p = pharmacy;
  const today = p.hoursForDate;
  const is24h = today.some((h) => h.is24h);
  const meta = statusMeta(p.openStatus);
  const live = p.openStatus.state === "OPEN" || p.openStatus.state === "CLOSING_SOON";
  const hoursStr =
    today.length === 0
      ? "—"
      : today.map((h) => (h.is24h ? "0:00 – 24:00" : `${h.opens} – ${h.closes}`)).join(", ");

  return (
    <Link
      href={`/apteka/${p.slug}`}
      className="card-hover card-accent animate-card-in group relative block rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)] sm:px-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {/* Na xl karta staje się siatką o stałych kolumnach — wszystkie wiersze listy
          są idealnie równe niezależnie od treści (kolumna „Info z apteki" rezerwuje
          miejsce nawet gdy apteka nic nie opublikowała). Poniżej xl: flex-wrap. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3.5 xl:grid xl:grid-cols-[minmax(0,1.4fr)_6.5rem_7rem_7rem_11rem_minmax(0,12rem)_4.5rem] xl:gap-x-4">
        <div className="flex min-w-0 flex-1 basis-60 items-center gap-3.5">
          <CrossTile is24h={is24h} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-ink">{p.name}</h3>
            <span className="mt-0.5 inline-block max-w-full truncate rounded-lg border bg-bg px-2 py-0.5 text-xs font-medium text-ink-soft">
              {p.address.street}, {p.address.city}
            </span>
          </div>
        </div>

        <div className="text-2xl font-extrabold tabular-nums tracking-tight text-ink transition-colors duration-300 group-hover:text-pharma-dark">
          {formatDistance(p.distanceMeters)}
        </div>

        <Stat
          Icon={Footprints}
          value={formatMinutes(p.walkMinutes)}
          label="pieszo"
          iconClass="stat-walk"
        />
        <Stat Icon={Car} value={formatMinutes(p.driveMinutes)} label="autem" iconClass="stat-car" />

        <div className="min-w-0 leading-tight">
          <span
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 font-bold tabular-nums",
              PILL_BY_STATE[p.openStatus.state],
            )}
            title={hoursStr}
          >
            {live && (
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="animate-halo absolute inline-flex h-full w-full rounded-full bg-current" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
              </span>
            )}
            <span className="truncate">{hoursStr}</span>
          </span>
          <div className="mt-1 truncate text-[11px] text-muted">{meta.label}</div>
        </div>

        {p.latestAnnouncement ? (
          <div className="hidden min-w-0 lg:block">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pharma px-2.5 py-0.5 text-xs font-bold text-white">
              <Megaphone className="h-3 w-3 shrink-0" aria-hidden />
              Info z apteki
            </span>
            <p className="mt-1 truncate text-xs text-muted" title={p.latestAnnouncement.title}>
              {ANNOUNCEMENT_LABELS[p.latestAnnouncement.type] ?? "Komunikat"}
              {" · "}
              {p.latestAnnouncement.title}
            </p>
          </div>
        ) : (
          // Pusty placeholder utrzymuje siatkę kolumn — wiersze się nie rozjeżdżają.
          <div className="hidden xl:block" aria-hidden />
        )}

        <div className="ml-auto flex items-center gap-1.5 xl:ml-0 xl:justify-end">
          <FavoriteButton slug={p.slug} />
          <ChevronRight className="chev h-5 w-5 text-muted" aria-hidden />
        </div>
      </div>
    </Link>
  );
}
