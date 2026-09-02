"use client";

import { useRouter } from "next/navigation";
import { Navigation, Search } from "lucide-react";
import type { ProgramCard } from "@/components/ui/pulse-fit-hero";
import {
  ProgressSlider,
  SliderBtn,
  SliderBtnGroup,
  SliderContent,
  SliderWrapper,
} from "@/components/ui/progressive-carousel";
import { cn } from "@/lib/utils";

// Hero strony głównej — jeden złączony blok (bez przerwy), zaokrąglony na zewnątrz:
//  • lewa (50%): „Znajdź najbliższą aptekę" na tle zdjęcia + przyciski (Zlokalizuj / Mapa),
//  • prawa (50%): galeria zdjęć (dawniej była tu mapa — teraz mapa jest w wynikach niżej).
// Obie kolumny równej wysokości; galeria wypełnia prawą stronę „na styk".

export function HomeShowcase({
  programs,
  locating,
  geoError,
  onLocate,
}: {
  programs: ProgramCard[];
  locating: boolean;
  geoError: string | null;
  onLocate: () => void;
}) {
  const router = useRouter();
  const hasGallery = programs.length > 0;

  return (
    <div className="mx-auto grid w-full max-w-[104rem] grid-cols-1 items-stretch overflow-hidden rounded-[2rem] border border-line shadow-[var(--shadow-card)] lg:h-[440px] lg:grid-cols-2">
      {/* ── Lewo: napis + zdjęcie w tle + przyciski ── */}
      <section className="relative flex min-h-[340px] flex-col justify-center bg-surface p-6 sm:p-8 lg:min-h-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-left bg-cover opacity-60"
          style={{ backgroundImage: "url('/background_img.png')" }}
        />
        {/* Fade do bieli przy prawej krawędzi — miękkie przejście w galerię */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.8) 82%, #ffffff 100%)",
          }}
        />

        <div className="relative z-10 max-w-md rounded-2xl bg-white/85 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <h2 className="text-3xl font-black leading-[1.05] tracking-tight text-ink sm:text-4xl">
            Znajdź
            <br />
            najbliższą aptekę
          </h2>
          <p className="mt-3 text-sm text-ink-soft sm:text-base">
            Sprawdź, która apteka jest otwarta i jak szybko do niej dotrzesz.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              onClick={onLocate}
              disabled={locating}
              className="pressable inline-flex items-center justify-center gap-3 rounded-lg bg-pharma px-5 py-3.5 text-base font-bold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-pharma-dark disabled:opacity-70"
            >
              <Navigation className="h-5 w-5" aria-hidden />
              {locating ? "Ustalanie…" : "Użyj mojej lokalizacji"}
            </button>
            <button
              onClick={() => router.push("/apteki")}
              className="pressable inline-flex items-center justify-center gap-3 rounded-lg px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-bg"
            >
              <Search className="h-5 w-5" aria-hidden />
              Wyszukaj
            </button>
          </div>

          {geoError && (
            <p
              className="mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger"
              role="alert"
            >
              {geoError}
            </p>
          )}
        </div>
      </section>

      {/* ── Prawo: galeria zdjęć (na styk, tam gdzie wcześniej była mapa) ── */}
      <section className={cn("relative min-h-[320px] bg-primary lg:min-h-0", !hasGallery && "hidden lg:block")}>
        {hasGallery && (
          <ProgressSlider activeSlider="slide-0" duration={5000} className="h-full overflow-hidden">
            <SliderContent className="relative h-full">
              {programs.map((p, i) => (
                <SliderWrapper key={i} value={`slide-${i}`} className="absolute inset-0">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- host uploadów; galeria nie potrzebuje next/image
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="grid h-full w-full place-items-center text-white/90"
                      style={{
                        backgroundImage: `linear-gradient(160deg, ${p.gradient?.from ?? "#0b4f9e"}, ${p.gradient?.to ?? "#083a72"})`,
                      }}
                    >
                      {p.icon}
                    </div>
                  )}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.72) 100%)" }}
                  />
                  <div className="absolute inset-x-0 top-0 p-5">
                    <h3 className="max-w-[90%] text-lg font-bold leading-snug text-white drop-shadow-md sm:text-xl">
                      {p.title}
                    </h3>
                  </div>
                </SliderWrapper>
              ))}
            </SliderContent>

            <SliderBtnGroup className="absolute inset-x-3 bottom-3 z-20 flex divide-x divide-white/40 overflow-hidden rounded-xl border border-white/40 bg-white/70 backdrop-blur-md">
              {programs.map((p, i) => (
                <SliderBtn
                  key={i}
                  value={`slide-${i}`}
                  className="flex-1 cursor-pointer px-2.5 py-2 text-left"
                  progressBarClass="h-full bg-pharma/20"
                >
                  <span className="relative z-10 block truncate text-[10px] font-bold uppercase tracking-wide text-ink">
                    {p.category}
                  </span>
                </SliderBtn>
              ))}
            </SliderBtnGroup>
          </ProgressSlider>
        )}
      </section>
    </div>
  );
}
