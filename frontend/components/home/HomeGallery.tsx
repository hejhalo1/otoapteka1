"use client";

import { useEffect, useState } from "react";
import { Clock, Megaphone, MoonStar, ShieldCheck, Syringe } from "lucide-react";
import { assetUrl, fetchPromoSlides, type PromoSlide } from "@/lib/api";
import HoverRevealCards, { type CardItem } from "@/components/ui/cards";

// Te same treści co dawna galeria (gdy admin nie dodał własnych zdjęć): gradient +
// ikona lucide + tytuł/podtytuł. Kolory na paletę (niebieski/teal/zieleń/pomarańcz).
const DEFAULT_ITEMS: CardItem[] = [
  {
    id: "d1",
    title: "Apteki dyżurne 24/7",
    subtitle: "Noc i święta",
    gradient: { from: "#122c47", to: "#2b539e" },
    icon: <MoonStar className="h-16 w-16" />,
  },
  {
    id: "d2",
    title: "Zawsze aktualne godziny",
    subtitle: "Co do minuty",
    gradient: { from: "#0b4f9e", to: "#083a72" },
    icon: <Clock className="h-16 w-16" />,
  },
  {
    id: "d3",
    title: "Szczepienia i usługi",
    subtitle: "Dodatkowe usługi",
    gradient: { from: "#0891b2", to: "#0e7490" },
    icon: <Syringe className="h-16 w-16" />,
  },
  {
    id: "d4",
    title: "Dane z rejestru CeZ",
    subtitle: "Oficjalne źródło",
    gradient: { from: "#4d7c0f", to: "#3f6212" },
    icon: <ShieldCheck className="h-16 w-16" />,
  },
  {
    id: "d5",
    title: "Komunikaty od aptek",
    subtitle: "Prosto z apteki",
    gradient: { from: "#b45309", to: "#92400e" },
    icon: <Megaphone className="h-16 w-16" />,
  },
];

/**
 * Galeria strony głównej w stylu hover-reveal. Pokazuje TO SAMO co dawna galeria:
 * własne slajdy admina (zdjęcia z panelu) albo domyślne ilustracje. Renderowana
 * tylko w pustym stanie — znika po ustaleniu lokalizacji (patrz HomeSearch).
 */
export function HomeGallery() {
  const [slides, setSlides] = useState<PromoSlide[] | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPromoSlides(ctrl.signal)
      .then((s) => setSlides(s))
      .catch(() => setSlides([]));
    return () => ctrl.abort();
  }, []);

  const items: CardItem[] =
    slides && slides.length > 0
      ? slides.map((s) => ({
          id: s.id,
          title: s.title ?? "Apteka",
          subtitle: s.subtitle ?? "Informacja",
          imageUrl: assetUrl(s.imageUrl),
        }))
      : DEFAULT_ITEMS;

  return (
    <section aria-label="Galeria" className="mt-8">
      <HoverRevealCards items={items} />
    </section>
  );
}
