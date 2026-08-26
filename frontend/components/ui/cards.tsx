import React from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  title: string;
  subtitle: string;
  /** Zdjęcie karty (np. slajd admina). Gdy brak — używamy gradientu + ikony. */
  imageUrl?: string;
  /** Gradient tła dla kart bez zdjęcia (nasze domyślne slajdy). */
  gradient?: { from: string; to: string };
  /** Ikona pokazywana na gradiencie (gdy brak zdjęcia). */
  icon?: React.ReactNode;
}

export interface HoverRevealCardsProps {
  items: CardItem[];
  className?: string;
  cardClassName?: string;
}

/**
 * Siatka kart z efektem hover-reveal: po najechaniu/fokusie jedna karta wysuwa się
 * na wierzch, a pozostałe przygasają (scale + blur + opacity). Karta bez zdjęcia
 * dostaje gradient + ikonę. Animacje wygaszone przy `prefers-reduced-motion`.
 */
const HoverRevealCards: React.FC<HoverRevealCardsProps> = ({
  items,
  className,
  cardClassName,
}) => {
  return (
    // `group` na kontenerze pozwala stylować dzieci przy hoverze rodzica.
    <div
      role="list"
      className={cn(
        "group grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="listitem"
          aria-label={`${item.title}, ${item.subtitle}`}
          tabIndex={0}
          className={cn(
            "relative h-80 cursor-pointer overflow-hidden rounded-2xl bg-cover bg-center shadow-[var(--shadow-card)] transition-all duration-500 ease-in-out",
            // Hover rodzica → przygaszenie wszystkich kart.
            "group-hover:scale-[0.97] group-hover:opacity-60 group-hover:blur-[2px]",
            // Hover/fokus karty → wysunięcie jej na wierzch (! wymusza pierwszeństwo).
            "hover:!scale-105 hover:!opacity-100 hover:!blur-none focus-visible:!scale-105 focus-visible:!opacity-100 focus-visible:!blur-none",
            // Dostępny pierścień fokusu (tokeny projektu).
            "ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            // Reduced-motion: bez animacji przejść.
            "motion-reduce:transition-none",
            cardClassName,
          )}
          style={
            item.imageUrl
              ? { backgroundImage: `url(${item.imageUrl})` }
              : item.gradient
                ? { backgroundImage: `linear-gradient(135deg, ${item.gradient.from}, ${item.gradient.to})` }
                : undefined
          }
        >
          {/* Ikona na gradiencie (karty bez zdjęcia). */}
          {!item.imageUrl && item.icon && (
            <div className="absolute inset-0 grid place-items-center text-white/90" aria-hidden>
              {item.icon}
            </div>
          )}
          {/* Gradient pod tekst — kontrast napisu na obrazie. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Treść karty. */}
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <p className="text-sm font-light uppercase tracking-widest opacity-80">
              {item.subtitle}
            </p>
            <h3 className="mt-1 text-2xl font-semibold">{item.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HoverRevealCards;
