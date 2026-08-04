"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Megaphone, MoonStar, ShieldCheck, Syringe } from "lucide-react";
import { assetUrl, fetchPromoSlides, type PromoSlide } from "@/lib/api";

// Domyślne, ilustrowane slajdy (bez zewnętrznych zdjęć) — pokazywane, gdy admin nie
// dodał jeszcze własnych. Kolory z palety, ikony lucide.
const DEFAULT_SLIDES = [
  {
    id: "d1",
    Icon: MoonStar,
    title: "Apteki dyżurne 24/7",
    subtitle: "Znajdź otwartą aptekę także w nocy i święta",
    from: "#122c47",
    to: "#2b539e",
    href: "/mapa",
  },
  {
    id: "d2",
    Icon: Clock,
    title: "Zawsze aktualne godziny",
    subtitle: "Status otwarcia liczony na bieżąco, co do minuty",
    from: "#279c53",
    to: "#1e7f42",
    href: null,
  },
  {
    id: "d3",
    Icon: Syringe,
    title: "Szczepienia i usługi",
    subtitle: "Sprawdź, które apteki oferują dodatkowe usługi",
    from: "#0891b2",
    to: "#0e7490",
    href: null,
  },
  {
    id: "d4",
    Icon: ShieldCheck,
    title: "Dane z rejestru CeZ",
    subtitle: "Oficjalne, codziennie aktualizowane dane aptek",
    from: "#8e44ad",
    to: "#6c3483",
    href: "/o-serwisie",
  },
  {
    id: "d5",
    Icon: Megaphone,
    title: "Komunikaty od aptek",
    subtitle: "Promocje, badania i informacje prosto z apteki",
    from: "#ef6c00",
    to: "#c65200",
    href: null,
  },
];

function DefaultCard({ s }: { s: (typeof DEFAULT_SLIDES)[number] }) {
  const inner = (
    <div
      className="relative flex h-44 w-72 shrink-0 flex-col justify-end overflow-hidden rounded-2xl border p-5 text-white shadow-[var(--shadow-card)] transition-transform duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-1"
      style={{ backgroundImage: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
    >
      <s.Icon className="absolute -right-3 -top-3 h-24 w-24 opacity-15" aria-hidden />
      <s.Icon className="mb-2 h-7 w-7" aria-hidden />
      <p className="text-lg font-extrabold leading-tight">{s.title}</p>
      <p className="mt-1 text-sm text-white/85">{s.subtitle}</p>
    </div>
  );
  return s.href ? (
    <Link href={s.href} className="pressable block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function PhotoCard({ s }: { s: PromoSlide }) {
  const inner = (
    <div className="relative h-44 w-72 shrink-0 overflow-hidden rounded-2xl border shadow-[var(--shadow-card)] transition-transform duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- dowolny host uploadów, marquee nie potrzebuje optymalizacji next/image */}
      <img
        src={assetUrl(s.imageUrl)}
        alt={s.title ?? "Slajd galerii"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {(s.title || s.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          {s.title && <p className="text-base font-extrabold leading-tight">{s.title}</p>}
          {s.subtitle && <p className="mt-0.5 text-xs text-white/85">{s.subtitle}</p>}
        </div>
      )}
    </div>
  );
  return s.href ? (
    <Link href={s.href} className="pressable block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/**
 * Auto-przewijana galeria w pustym stanie strony głównej. Domyślnie ilustrowane
 * slajdy; gdy admin doda własne przez panel — pokazują się one. Dwie kopie treści
 * dają płynną, nieskończoną pętlę; hover pauzuje; reduced-motion zatrzymuje.
 */
export function PromoGallery() {
  const [slides, setSlides] = useState<PromoSlide[] | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPromoSlides(ctrl.signal)
      .then((s) => setSlides(s))
      .catch(() => setSlides([]));
    return () => ctrl.abort();
  }, []);

  const usingPhotos = slides != null && slides.length > 0;
  // Zawsze mamy co pokazać: własne slajdy admina albo domyślne ilustracje.
  const cards = usingPhotos
    ? slides.map((s) => <PhotoCard key={s.id} s={s} />)
    : DEFAULT_SLIDES.map((s) => <DefaultCard key={s.id} s={s} />);

  return (
    <section aria-label="Galeria" className="mt-8">
      <div className="marquee-viewport marquee-fade overflow-hidden py-1">
        <div className="marquee-track flex gap-4">
          {/* Dwie kopie — pętla bez skoku. Druga kopia jest dekoracyjna. */}
          <div className="flex gap-4">{cards}</div>
          <div className="flex gap-4" aria-hidden>
            {usingPhotos
              ? slides.map((s) => <PhotoCard key={`b-${s.id}`} s={s} />)
              : DEFAULT_SLIDES.map((s) => <DefaultCard key={`b-${s.id}`} s={s} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
