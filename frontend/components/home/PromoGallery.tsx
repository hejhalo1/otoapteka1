"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Clock, Megaphone, MoonStar, ShieldCheck, Syringe } from "lucide-react";
import { assetUrl, fetchPromoSlides, type PromoSlide } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    href: "/mapa" as string | null,
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

interface FrameItem {
  key: string;
  href: string | null;
  title?: string | null;
  subtitle?: string | null;
  // Pełne tło kwadratu (zdjęcie albo gradient z ikoną).
  bg: ReactNode;
}

function defaultBg(s: (typeof DEFAULT_SLIDES)[number]): ReactNode {
  return (
    <div
      className="relative h-full w-full"
      style={{ backgroundImage: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
    >
      <s.Icon className="absolute -right-5 -top-5 h-36 w-36 text-white opacity-15" aria-hidden />
      <div className="grid h-full place-items-center">
        <s.Icon className="h-16 w-16 text-white/90" aria-hidden />
      </div>
    </div>
  );
}

/**
 * Galeria w pustym stanie: JEDEN kwadrat w stylowej ramce, który przewija się co
 * kilka sekund (crossfade). Wypełnia miejsce pod krótką sekcją miast, obok wysokiej
 * mapy. Domyślnie ilustrowane slajdy; gdy admin doda własne zdjęcia — pokazują się
 * one. Pauza na hover; kropki do ręcznej zmiany; reduced-motion wyłącza auto-zmianę.
 */
export function PromoGallery({ className }: { className?: string }) {
  const [slides, setSlides] = useState<PromoSlide[] | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPromoSlides(ctrl.signal)
      .then((s) => setSlides(s))
      .catch(() => setSlides([]));
    return () => ctrl.abort();
  }, []);

  const usingPhotos = slides != null && slides.length > 0;
  const items: FrameItem[] = usingPhotos
    ? slides.map((s) => ({
        key: s.id,
        href: s.href ?? null,
        title: s.title,
        subtitle: s.subtitle,
        bg: (
          // eslint-disable-next-line @next/next/no-img-element -- dowolny host uploadów; kwadrat galerii nie potrzebuje optymalizacji next/image
          <img
            src={assetUrl(s.imageUrl)}
            alt={s.title ?? "Slajd galerii"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ),
      }))
    : DEFAULT_SLIDES.map((s) => ({
        key: s.id,
        href: s.href,
        title: s.title,
        subtitle: s.subtitle,
        bg: defaultBg(s),
      }));

  const count = items.length;
  const idx = count ? active % count : 0;

  // Auto-przewijanie — wyłączone przy pauzie, jednym slajdzie i reduced-motion.
  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), 4500);
    return () => clearInterval(t);
  }, [paused, count]);

  if (!count) return null;

  return (
    <section
      aria-label="Galeria"
      aria-roledescription="karuzela"
      className={cn("flex flex-col", className)}
    >
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative flex flex-1 flex-col rounded-3xl border bg-gradient-to-br from-surface to-bg p-2.5 shadow-[var(--shadow-lift)] transition-transform duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-0.5"
      >
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border bg-bg">
          {items.map((it, i) => (
            <div
              key={it.key}
              aria-hidden={i !== idx}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none",
                i === idx ? "opacity-100" : "opacity-0",
              )}
            >
              {it.bg}
              {(it.title || it.subtitle) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-5 text-white">
                  {it.title && (
                    <p className="text-lg font-extrabold leading-tight drop-shadow-sm">{it.title}</p>
                  )}
                  {it.subtitle && <p className="mt-1 text-sm text-white/85">{it.subtitle}</p>}
                </div>
              )}
              {it.href && (
                <Link
                  href={it.href}
                  aria-label={it.title ?? "Zobacz więcej"}
                  tabIndex={i === idx ? 0 : -1}
                  className={cn("absolute inset-0", i !== idx && "pointer-events-none")}
                />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            {items.map((it, i) => (
              <button
                key={it.key}
                onClick={() => setActive(i)}
                aria-label={`Pokaż slajd ${i + 1}`}
                aria-current={i === idx}
                className={cn(
                  "pressable h-1.5 rounded-full transition-all duration-300 [transition-timing-function:var(--ease-out)]",
                  i === idx ? "w-6 bg-pharma" : "w-1.5 bg-line hover:bg-pharma/50",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
