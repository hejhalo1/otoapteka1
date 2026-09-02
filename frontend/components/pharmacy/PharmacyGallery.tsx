"use client";

import { useState } from "react";
import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

// Krzyż apteczny (fallback, gdy apteka nie dodała zdjęć).
function CrossPlaceholder({ name }: { name: string }) {
  return (
    <div
      className="grid aspect-[4/3] w-full place-items-center rounded-lg border border-line bg-gradient-to-br from-pharma to-pharma-dark text-white/90 shadow-[var(--shadow-card)]"
      aria-label={name}
    >
      <svg viewBox="0 0 24 24" className="h-20 w-20" fill="currentColor" aria-hidden>
        <path d="M9.1 2.6h5.8a1.3 1.3 0 0 1 1.3 1.3v5h5a1.3 1.3 0 0 1 1.3 1.3v5.8a1.3 1.3 0 0 1-1.3 1.3h-5v5a1.3 1.3 0 0 1-1.3 1.3H9.1a1.3 1.3 0 0 1-1.3-1.3v-5h-5a1.3 1.3 0 0 1-1.3-1.3v-5.8a1.3 1.3 0 0 1 1.3-1.3h5v-5a1.3 1.3 0 0 1 1.3-1.3z" />
      </svg>
    </div>
  );
}

/**
 * Galeria zdjęć apteki: duże zdjęcie główne + rząd miniatur (ostatnia z „+N",
 * gdy zdjęć jest więcej). Klik miniatury zmienia zdjęcie główne.
 */
export function PharmacyGallery({
  photos,
  name,
}: {
  photos: { url: string }[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) return <CrossPlaceholder name={name} />;

  const thumbs = photos.slice(0, 4);
  const extra = photos.length - 4;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-bg shadow-[var(--shadow-card)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- host uploadów apteki (poza next/image) */}
        <img
          src={assetUrl(photos[active]?.url ?? photos[0].url)}
          alt={`${name} — zdjęcie ${active + 1}`}
          className="h-full w-full object-cover"
        />
      </div>

      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((ph, i) => {
            const showExtra = i === 3 && extra > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Pokaż zdjęcie ${i + 1}`}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border transition-colors",
                  active === i ? "border-pharma ring-2 ring-pharma/30" : "border-line hover:border-pharma/60",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- host uploadów apteki */}
                <img src={assetUrl(ph.url)} alt="" className="h-full w-full object-cover" />
                {showExtra && (
                  <span className="absolute inset-0 grid place-items-center bg-ink/65 text-lg font-black text-white">
                    +{extra}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
