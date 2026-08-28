"use client";

import { useRouter } from "next/navigation";
import { Map, Navigation, Search } from "lucide-react";
import type { ProgramCard } from "@/components/ui/pulse-fit-hero";
import { HeroActionButton } from "@/components/ui/hero-action-button";
import {
  ProgressSlider,
  SliderBtn,
  SliderBtnGroup,
  SliderContent,
  SliderWrapper,
} from "@/components/ui/progressive-carousel";
import { HomeBento } from "./HomeBento";

// Górna część strony (nad kafelkami/mapą) w DWÓCH sekcjach obok siebie:
//  • lewa (40%): galeria na niebieskim tle (ten sam błękit co kafelek „Informacje
//    o dyżurach") + duży, biały nagłówek wersalikami,
//  • prawa (60%): kolorowe bento, a POD nim trzy lokalizatory (Wyszukaj najmniejszy).
// Obie sekcje równej wysokości (items-stretch); galeria wypełnia miejsce pod nagłówkiem.

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

  // Dwie sekcje POŁĄCZONE w jeden blok (bez przerwy): lewa niebieska styka się
  // twardą krawędzią z prawą białą — zaokrąglamy tylko zewnętrzne narożniki.
  return (
    <div className="mx-auto grid w-full max-w-[112rem] grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_2px_minmax(0,3fr)] lg:gap-8">
      {/* ── Sekcja 1: galeria na niebieskim tle + biały nagłówek + biała ramka 4px ── */}
      <section
        className="flex flex-col gap-5 overflow-hidden rounded-[2rem] p-5 shadow-[var(--shadow-card)] sm:p-6"
        style={{ backgroundImage: "linear-gradient(135deg,#0ea5e9 0%,#0b4f9e 100%)" }}
      >
        <h2 className="text-3xl font-black uppercase leading-[1.1] tracking-tight text-white sm:text-4xl">
          Znajdź wszystkie apteki i aktualne informacje
        </h2>

        {hasGallery && (
          <div className="min-h-[320px] flex-1">
            <ProgressSlider
              activeSlider="slide-0"
              duration={5000}
              className="h-full overflow-hidden rounded-3xl border-4 border-white shadow-[var(--shadow-card)]"
            >
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
          </div>
        )}
      </section>

      {/* Niebieska pionowa kreska rozdzielająca sekcje (tylko na szerokich ekranach) */}
      <div aria-hidden className="hidden self-stretch rounded-full bg-primary/40 lg:block" />

      {/* ── Sekcja 2: białe bento + trzy lokalizatory POD nim (Wyszukaj najmniejszy) ── */}
      <section className="flex flex-col gap-5 rounded-[2rem] border-2 border-primary/25 bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <HomeBento />

        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_0.7fr]">
            <HeroActionButton
              theme="red"
              icon={<Navigation aria-hidden />}
              title={locating ? "Ustalanie…" : "Zlokalizuj"}
              subtitle="Najbliższe apteki"
              loading={locating}
              onClick={onLocate}
              className="sm:w-full"
            />
            <HeroActionButton
              theme="blue"
              icon={<Map aria-hidden />}
              title="Wybierz"
              subtitle="Otwórz pełną mapę"
              onClick={() => router.push("/mapa")}
              className="sm:w-full"
            />
            <HeroActionButton
              theme="navy"
              icon={<Search aria-hidden />}
              title="Wyszukaj"
              onClick={() => router.push("/apteki")}
              className="sm:w-full"
            />
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
    </div>
  );
}
