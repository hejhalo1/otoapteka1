"use client";

import { useEffect, useState } from "react";
import { Clock, Megaphone, MoonStar, ShieldCheck, Syringe } from "lucide-react";
import { assetUrl, fetchPromoSlides, type PromoSlide } from "@/lib/api";
import { PulseFitHero, type ProgramCard } from "@/components/ui/pulse-fit-hero";
import { HomeShowcase } from "./HomeShowcase";

// Domyślna galeria (gdy admin nie dodał slajdów) — te same treści co dawniej.
// Zdjęcia z `public/`; gradient+ikona to fallback, gdyby pliku zabrakło.
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
 * Hero strony głównej: kompaktowa sekcja (bez pełnoekranowego tytułu), żeby galeria
 * i bento były widoczne od razu. Trzy lokalizatory nad bento, nagłówek nad galerią —
 * całość składa `HomeShowcase`. Tłem jest dyskretny wzór kropek.
 */
export function HomeHero({
  locating,
  geoError,
  onLocate,
}: {
  locating: boolean;
  geoError: string | null;
  onLocate: () => void;
}) {
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
        }))
      : DEFAULT_PROGRAMS;

  return (
    <PulseFitHero showHeader={false}>
      <HomeShowcase
        programs={programs}
        locating={locating}
        geoError={geoError}
        onLocate={onLocate}
      />
    </PulseFitHero>
  );
}
