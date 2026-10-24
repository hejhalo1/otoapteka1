"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { fetchPharmacies } from "@/lib/api";
import type { Coords } from "@/lib/geo";
import type { PharmacyCard } from "@/lib/types";
import { ANNOUNCEMENT_LABELS, formatDistance } from "@/lib/format";
import { announcementMeta } from "@/lib/announcement-meta";
import { pharmacyPath } from "@/lib/slug";
import { LocationGate } from "./LocationGate";

type FeedItem = { a: PharmacyCard["announcements"][number]; p: PharmacyCard };

function relDay(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "dziś";
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(iso));
}

function Feed({ coords }: { coords: Coords }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    void (async () => {
      try {
        const res = await fetchPharmacies(
          { lat: coords.lat, lng: coords.lng, radiusKm: 25, perPage: 60, openNow: false },
          ctrl.signal,
        );
        if (!alive) return;
        const flat: FeedItem[] = res.data.flatMap((p) => p.announcements.map((a) => ({ a, p })));
        flat.sort((x, y) => (y.a.publishedAt ?? "").localeCompare(x.a.publishedAt ?? ""));
        setItems(flat);
      } catch (e) {
        if (alive && (e as Error).name !== "AbortError") {
          setError("Nie udało się pobrać komunikatów. Spróbuj ponownie.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [coords.lat, coords.lng]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="rounded-2xl border border-line bg-surface p-8 text-center font-semibold text-danger">{error}</p>;
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-bg text-muted">
          <Inbox className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-3 text-lg font-bold text-ink">Brak komunikatów w okolicy</p>
        <p className="mt-1 text-muted">Apteki w pobliżu nie dodały ostatnio żadnych informacji.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map(({ a, p }, i) => {
        const m = announcementMeta(a.type);
        const Icon = m.icon;
        return (
          <Link
            key={`${p.id}-${i}`}
            href={pharmacyPath(p.address.voivodeship, p.address.city, p.slug)}
            className="card-hover group block rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] text-white"
                style={{ backgroundColor: m.color }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="truncate text-xs font-bold uppercase tracking-wide"
                    style={{ color: m.color }}
                  >
                    {ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {relDay(a.publishedAt)}
                  </span>
                </div>
                <h3 className="mt-0.5 font-black text-ink">{a.title}</h3>
                {a.body && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{a.body}</p>}
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  <span className="font-semibold text-ink-soft">{p.name}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">{formatDistance(p.distanceMeters)}</span>
                  <span aria-hidden>·</span>
                  <span className="font-semibold text-pharma-dark group-hover:underline">Zobacz aptekę</span>
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function NearbyAnnouncements() {
  return (
    <LocationGate prompt="Pokażemy najnowsze komunikaty, usługi i informacje z aptek najbliżej Ciebie.">
      {(coords) => <Feed coords={coords} />}
    </LocationGate>
  );
}
