"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Map, Megaphone, MoonStar, Navigation, ShieldCheck, Syringe } from "lucide-react";
import { assetUrl, fetchPromoSlides, type PromoSlide } from "@/lib/api";
import type { Coords } from "@/lib/geo";
import { PulseFitHero, type ProgramCard } from "@/components/ui/pulse-fit-hero";
import { DotPattern } from "@/components/ui/dot-pattern";
import { CityPostalSearch } from "./CityPostalSearch";
import { HomeShowcase } from "./HomeShowcase";

// Domyślna karuzela (gdy admin nie dodał slajdów) — te same treści co dawna galeria.
// Zdjęcia z `public/` (nazwy dopasowane do kart); gradient+ikona to fallback, gdyby
// pliku zabrakło.
const DEFAULT_PROGRAMS: ProgramCard[] = [
  {
    image: "/dyzury.jpg",
    category: "Dyżury 24/7",
    title: "Apteki otwarte nocą i w święta",
    gradient: { from: "#122c47", to: "#2b539e" },
    icon: <MoonStar className="h-24 w-24" aria-hidden />,
  },
  {
    image: "/godziny.jpg",
    category: "Godziny otwarcia",
    title: "Zawsze aktualne, co do minuty",
    gradient: { from: "#0b4f9e", to: "#083a72" },
    icon: <Clock className="h-24 w-24" aria-hidden />,
  },
  {
    image: "/uslugi.jpg",
    category: "Usługi",
    title: "Szczepienia i badania w aptekach",
    gradient: { from: "#0891b2", to: "#0e7490" },
    icon: <Syringe className="h-24 w-24" aria-hidden />,
  },
  {
    image: "/rejestr.jpg",
    category: "Rejestr CeZ",
    title: "Oficjalne, codziennie aktualizowane dane",
    gradient: { from: "#4d7c0f", to: "#3f6212" },
    icon: <ShieldCheck className="h-24 w-24" aria-hidden />,
  },
  {
    image: "/komunikaty.jpg",
    category: "Komunikaty",
    title: "Informacje prosto z apteki",
    gradient: { from: "#b45309", to: "#92400e" },
    icon: <Megaphone className="h-24 w-24" aria-hidden />,
  },
];

/**
 * Hero strony głównej: styl/animacje/layout „PulseFit", treści i dane nasze.
 * Główna akcja lokalizuje aptekę; alternatywnie wpisanie miasta (slot input).
 * Karuzela pokazuje te same dane co dawna galeria (slajdy admina albo domyślne).
 */
export function HomeHero({
  locating,
  geoError,
  onLocate,
  onCity,
}: {
  locating: boolean;
  geoError: string | null;
  onLocate: () => void;
  onCity: (c: Coords) => void;
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<PromoSlide[] | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPromoSlides(ctrl.signal)
      .then((s) => setSlides(s))
      .catch(() => setSlides([]));
    return () => ctrl.abort();
  }, []);

  const programs: ProgramCard[] =
    slides && slides.length > 0
      ? slides.map((s) => ({
          image: assetUrl(s.imageUrl),
          category: s.subtitle ?? "Apteka",
          title: s.title ?? "Informacja",
          onClick: s.href ? () => router.push(s.href as string) : undefined,
        }))
      : DEFAULT_PROGRAMS;

  return (
    <PulseFitHero
      showHeader={false}
      background={
        <DotPattern
          width={22}
          height={22}
          cx={1}
          cy={1}
          cr={1.1}
          // Kropki wychodzą spomiędzy przycisków (Zlokalizuj / Wybierz) i rozchodzą
          // się na boki — środek maski na ~34% wysokości sekcji (poziom przycisków).
          className="fill-primary/20 [mask-image:radial-gradient(70%_55%_at_50%_34%,#000_22%,transparent_80%)]"
        />
      }
      title={
        <>
          Znajdź wszystkie <span className="text-primary">apteki</span> i najważniejsze informacje
        </>
      }
      subtitle="Lokalizator aptek w Polsce. W kilka sekund zobaczysz najbliższą, aktualnie otwartą aptekę — dystans, czas dojścia i dojazdu oraz komunikaty prosto z apteki."
      primaryAction={{
        label: locating ? "Ustalanie pozycji…" : "Zlokalizuj",
        onClick: onLocate,
        loading: locating,
        icon: <Navigation aria-hidden />,
        subtitle: "Najbliższe apteki",
      }}
      secondaryAction={{
        label: "Wybierz",
        onClick: () => router.push("/mapa"),
        icon: <Map aria-hidden />,
        subtitle: "Otwórz pełną mapę",
      }}
      extraContent={
        <div className="rounded-2xl border border-line bg-surface/80 p-4 text-left shadow-[var(--shadow-card)] backdrop-blur">
          <div className="mb-3 flex items-center gap-3 text-muted">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-bold uppercase tracking-wide">lub wpisz miasto</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <CityPostalSearch onResolved={onCity} />
          {geoError && (
            <p
              className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
              role="alert"
            >
              {geoError}
            </p>
          )}
        </div>
      }
      socialProof={{
        image: "/checkmark.png",
        text: "Tysiące aptek z całej Polski — dane z oficjalnego rejestru CeZ",
      }}
      bottomSlot={<HomeShowcase programs={programs} />}
    />
  );
}
