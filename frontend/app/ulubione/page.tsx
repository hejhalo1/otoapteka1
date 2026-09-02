"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, HeartOff, Phone } from "lucide-react";
import { fetchPharmacyBySlugClient } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import { pharmacyPath } from "@/lib/slug";
import type { PharmacyDetail } from "@/lib/types";
import { OpenBadge } from "@/components/OpenBadge";
import { FavoriteButton } from "@/components/FavoriteButton";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="skeleton h-12 w-12 shrink-0 rounded-2xl" />
      <div className="flex-1">
        <div className="skeleton h-5 w-1/3 rounded" />
        <div className="skeleton mt-2 h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

/** Ulubione apteki — slugi z localStorage, dane dociągane z API. */
export default function FavoritesPage() {
  const slugs = useFavorites();
  const [items, setItems] = useState<PharmacyDetail[] | null>(null);

  useEffect(() => {
    if (slugs.length === 0) return; // pusty stan obsługuje render poniżej
    const ctrl = new AbortController();
    Promise.all(slugs.map((s) => fetchPharmacyBySlugClient(s, ctrl.signal).catch(() => null)))
      .then((res) => setItems(res.filter((p): p is PharmacyDetail => p !== null)))
      .catch(() => setItems([]));
    return () => ctrl.abort();
  }, [slugs]);

  const visible = slugs.length === 0 ? [] : items;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Ulubione apteki</h1>
      <p className="mt-1 text-muted">
        Zapisane tylko w tej przeglądarce — nic nie wysyłamy na serwer.
      </p>

      <div className="mt-6 grid gap-3">
        {visible === null ? (
          Array.from({ length: Math.max(slugs.length, 2) }).map((_, i) => <RowSkeleton key={i} />)
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-bg text-muted">
              <HeartOff className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-3 text-lg font-bold text-ink">Nie masz jeszcze ulubionych</p>
            <p className="mx-auto mt-1 max-w-sm text-muted">
              Kliknij serduszko przy aptece na liście wyników, a znajdziesz ją tutaj.
            </p>
            <Link
              href="/"
              className="pressable mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 font-bold text-white hover:bg-primary-dark"
            >
              Znajdź aptekę
            </Link>
          </div>
        ) : (
          visible.map((p, i) => (
            <Link
              key={p.slug}
              href={pharmacyPath(p.address.voivodeship, p.address.city, p.slug)}
              className="card-hover animate-card-in group block rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="cross-tile grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pharma shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="white" aria-hidden>
                    <path d="M9.1 2.6h5.8a1.3 1.3 0 0 1 1.3 1.3v5h5a1.3 1.3 0 0 1 1.3 1.3v5.8a1.3 1.3 0 0 1-1.3 1.3h-5v5a1.3 1.3 0 0 1-1.3 1.3H9.1a1.3 1.3 0 0 1-1.3-1.3v-5h-5a1.3 1.3 0 0 1-1.3-1.3v-5.8a1.3 1.3 0 0 1 1.3-1.3h5v-5a1.3 1.3 0 0 1 1.3-1.3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 basis-52">
                  <h2 className="truncate text-lg font-bold text-ink">{p.name}</h2>
                  <p className="truncate text-sm text-muted">
                    {p.address.street}, {p.address.postalCode} {p.address.city}
                  </p>
                </div>
                <OpenBadge status={p.openStatus} size="sm" />
                {p.phone && (
                  <span className="hidden items-center gap-1.5 text-sm text-ink-soft sm:flex">
                    <Phone className="h-3.5 w-3.5" aria-hidden /> {p.phone}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <FavoriteButton slug={p.slug} />
                  <ChevronRight className="chev h-5 w-5 text-muted" aria-hidden />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
