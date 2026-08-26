"use client";

import type { ProgramCard } from "@/components/ui/pulse-fit-hero";
import {
  ProgressSlider,
  SliderBtn,
  SliderBtnGroup,
  SliderContent,
  SliderWrapper,
} from "@/components/ui/progressive-carousel";
import { HomeBento } from "./HomeBento";

// Dolna sekcja hero: wspólny panel (lekkie tło + zaokrąglona ramka) z galerią (40%)
// i kolorowym bento (60%), rozdzielonymi pionową estetyczną kreską. Galeria rozciąga
// się na pełną wysokość rzędu (= wysokość bento), więc oba moduły ładnie współgrają.

export function HomeShowcase({ programs }: { programs: ProgramCard[] }) {
  const hasGallery = programs.length > 0;

  return (
    <div className="mx-auto w-full max-w-[112rem]">
      <div className="grid items-stretch gap-6 rounded-[2rem] border border-primary/15 bg-pharma-soft/55 p-4 shadow-[var(--shadow-card)] sm:p-6 lg:grid-cols-[minmax(0,2fr)_1px_minmax(0,3fr)] lg:gap-8">
        {/* ── 40%: galeria (progresywny carousel) — pełna wysokość rzędu ── */}
        {hasGallery && (
          <ProgressSlider
            activeSlider="slide-0"
            duration={5000}
            className="overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-card)] lg:h-full"
          >
            <SliderContent className="relative h-[360px] sm:h-[440px] lg:h-full">
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
                  {/* Tylko dłuższy tekst rozwijający temat — bez powtarzanej etykiety. */}
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

        {/* ── Pionowa kreska rozdzielająca (tylko na szerokich ekranach) ── */}
        <div
          aria-hidden
          className="hidden lg:block"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(11,79,158,0.28) 18%, rgba(11,79,158,0.28) 82%, transparent 100%)",
          }}
        />

        {/* ── 60%: kolorowe bento „co robi serwis" ── */}
        <HomeBento />
      </div>
    </div>
  );
}
