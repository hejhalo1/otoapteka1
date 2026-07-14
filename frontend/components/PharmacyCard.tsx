import Link from "next/link";
import type { PharmacyCard as Card } from "@/lib/types";
import {
  ANNOUNCEMENT_LABELS,
  formatDistance,
  formatMinutes,
} from "@/lib/format";
import { OpenBadge } from "./OpenBadge";

// Karta apteki w liście wyników — wszystko widoczne bez klikania (wzorzec Koleo).
export function PharmacyCard({ pharmacy, index = 0 }: { pharmacy: Card; index?: number }) {
  const p = pharmacy;
  const today = p.hoursForDate;
  return (
    <Link
      href={`/apteka/${p.slug}`}
      className="card-hover animate-card-in block rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{p.name}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {p.address.street}, {p.address.postalCode} {p.address.city}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-teal">{formatDistance(p.distanceMeters)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OpenBadge status={p.openStatus} />
        {p.latestAnnouncement && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 px-2.5 py-1 text-xs font-semibold text-violet">
            <span aria-hidden>📣</span>
            {ANNOUNCEMENT_LABELS[p.latestAnnouncement.type] ?? "Info z apteki"}
          </span>
        )}
      </div>

      {/* Duże godziny na dziś */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Dziś</span>
        <span className="text-xl font-bold tabular-nums text-ink">
          {today.length === 0
            ? "—"
            : today.map((h) => (h.is24h ? "całą dobę" : `${h.opens}–${h.closes}`)).join(", ")}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden>🚶</span> {formatMinutes(p.walkMinutes)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden>🚗</span> {formatMinutes(p.driveMinutes)}
        </span>
        {p.phone && <span className="ml-auto truncate text-muted">{p.phone}</span>}
      </div>
    </Link>
  );
}
