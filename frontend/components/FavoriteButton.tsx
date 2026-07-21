"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";

/**
 * Serduszko ulubionych — pop przy zaznaczeniu. Działa też wewnątrz <Link>
 * (preventDefault), więc można je kłaść bezpośrednio na karcie apteki.
 */
export function FavoriteButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [fav, toggle] = useFavorite(slug);
  const [popping, setPopping] = useState(false);

  return (
    <button
      type="button"
      aria-label={fav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-pressed={fav}
      title={fav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowFav = toggle();
        if (nowFav) {
          setPopping(true);
          window.setTimeout(() => setPopping(false), 450);
        }
      }}
      className={cn(
        "pressable relative grid h-9 w-9 place-items-center rounded-full border bg-surface text-muted transition-colors",
        "hover:border-danger/40 hover:text-danger",
        fav && "border-danger/30 text-danger",
        className,
      )}
    >
      {/* Pierścień rozchodzący się przy dodaniu do ulubionych. */}
      {popping && (
        <span aria-hidden className="animate-halo absolute inset-0 rounded-full bg-danger/40" />
      )}
      <Heart
        className={cn("h-4.5 w-4.5 transition-transform", popping && "animate-heart-pop")}
        fill={fav ? "currentColor" : "none"}
        strokeWidth={2.2}
        aria-hidden
      />
    </button>
  );
}
