"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, MoonStar } from "lucide-react";
import { fetchPharmacies } from "@/lib/api";
import type { Coords } from "@/lib/geo";
import type { PharmacyCard } from "@/lib/types";
import { formatDistance } from "@/lib/format";
import { pharmacyPath } from "@/lib/slug";
import { LocationGate } from "./LocationGate";

function dutyDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const ymd = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(x);
  const today = ymd(now);
  const tomorrow = ymd(new Date(now.getTime() + 86_400_000));
  const ds = ymd(d);
  if (ds === today) return "Dziś";
  if (ds === tomorrow) return "Jutro";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(d);
}
function dutyTime(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(iso));
}

function Feed({ coords }: { coords: Coords }) {
  const [items, setItems] = useState<PharmacyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    void (async () => {
      try {
        const res = await fetchPharmacies(
          { lat: coords.lat, lng: coords.lng, radiusKm: 30, perPage: 80, openNow: false },
          ctrl.signal,
        );
        if (!alive) return;
        const withDuty = res.data
          .filter((p) => p.duty)
          .sort((a, b) => a.distanceMeters - b.distanceMeters);
        setItems(withDuty);
      } catch (e) {
        if (alive && (e as Error).name !== "AbortError") {
          setError("Nie udało się pobrać dyżurów. Spróbuj ponownie.");
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
        {Array.from({ length: 4 }).map((_, i) => (
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
          <MoonStar className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-3 text-lg font-bold text-ink">Brak dyżurów w okolicy</p>
        <p className="mt-1 text-muted">
          Nie znaleźliśmy zaplanowanych dyżurów w pobliżu. Spróbuj później lub zwiększ obszar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((p) => {
        const onDutyNow = p.openStatus.isDuty;
        return (
          <Link
            key={p.id}
            href={pharmacyPath(p.address.voivodeship, p.address.city, p.slug)}
            className="card-hover group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#c2410c] text-white">
              <MoonStar className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="truncate font-black text-ink">{p.name}</h3>
                {onDutyNow && (
                  <span className="rounded-full bg-[#c2410c]/12 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#9a3412]">
                    Na dyżurze teraz
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {p.address.street}, {p.address.city}
                <span aria-hidden>·</span>
                <span className="shrink-0 font-semibold tabular-nums text-pharma-dark">
                  {formatDistance(p.distanceMeters)}
                </span>
              </p>
              {p.duty && (
                <p className="mt-1.5 text-sm">
                  <span className="font-bold text-[#9a3412]">{dutyDate(p.duty.startsAt)} dyżur: </span>
                  <span className="font-black tabular-nums text-ink">
                    {dutyTime(p.duty.startsAt)} – {dutyTime(p.duty.endsAt)}
                  </span>
                </p>
              )}
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}

export default function NearbyDuties() {
  return (
    <LocationGate prompt="Pokażemy apteki pełniące dyżur najbliżej Ciebie oraz godziny dyżurów.">
      {(coords) => <Feed coords={coords} />}
    </LocationGate>
  );
}
