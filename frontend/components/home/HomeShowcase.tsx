"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useState } from "react";
import { MapPin, MessageSquareText, Moon } from "lucide-react";
import { GEO_ERROR_MESSAGES, GeoError, getCurrentPosition } from "@/lib/geo";
import { readLastLocation, saveLastLocation } from "@/lib/last-location";

// Hero strony głównej: szeroki baner z ilustracją w tle (main_background_image.png),
// nagłówek po lewej, a pod spodem trzy karty-wejścia. „Info z aptek" i „Dyżury"
// wymagają lokalizacji — bez niej klik prosi o nią i dopiero potem przechodzi dalej.
export function HomeShowcase({
  locating,
  geoError,
  onLocate,
}: {
  locating: boolean;
  geoError: string | null;
  onLocate: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [navError, setNavError] = useState<string | null>(null);

  // Przejście do podstrony wymagającej lokalizacji — jeśli jej nie mamy, najpierw prosimy.
  const goWithLocation = async (path: string, key: string) => {
    setNavError(null);
    if (readLastLocation()) {
      router.push(path);
      return;
    }
    setBusy(key);
    try {
      const c = await getCurrentPosition();
      saveLastLocation({ ...c, label: "Twoja lokalizacja" });
      router.push(path);
    } catch (e) {
      setNavError(
        GEO_ERROR_MESSAGES[e as GeoError] ?? "Udostępnij lokalizację, aby przejść dalej.",
      );
    } finally {
      setBusy(null);
    }
  };

  const cards = [
    {
      key: "near",
      color: "#15803d",
      icon: MapPin,
      title: "Najbliższa apteka",
      desc: "Znajdź aptekę w pobliżu i zobacz odległość.",
      onClick: onLocate,
      loading: locating,
    },
    {
      key: "info",
      color: "#0b4f9e",
      icon: MessageSquareText,
      title: "Info z apteki",
      desc: "Aktualne informacje, usługi i komunikaty.",
      onClick: () => goWithLocation("/info-z-aptek", "info"),
      loading: busy === "info",
    },
    {
      key: "duty",
      color: "#c2410c",
      icon: Moon,
      title: "Apteka dyżurna dziś",
      desc: "Sprawdź, która apteka pełni dyżur w Twojej okolicy.",
      onClick: () => goWithLocation("/dyzury", "duty"),
      loading: busy === "duty",
    },
  ];

  return (
    <div className="w-full">
      {/* TEST: bez panelu-ramki — hero i karty na całą szerokość ekranu. */}
      <div>
        {/* HERO — ilustracja + nagłówek, pełny bleed (bez ramki/zaokrągleń), styka się z headerem */}
        <div className="relative flex min-h-[400px] flex-col overflow-hidden bg-surface lg:min-h-[470px]">
          {/* Ilustracja w tle — BEZ skalowania kadrującego (contain = cały obraz, bez zoomu
              i bez przycinania przez CSS), zakotwiczona po prawej. Kadr ustawiasz, przycinając
              sam plik main_background_image.png — to, co w nim jest, pokaże się wiernie. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-contain bg-right bg-no-repeat"
            style={{ backgroundImage: "url('/main_background_image.png')" }}
          />
          {/* Przejaśnienie tylko po lewej (pod nagłówkiem) — reszta zdjęcia zostaje widoczna */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.99) 22%, rgba(255,255,255,0.72) 34%, rgba(255,255,255,0) 44%)",
            }}
          />
          {/* Nagłówek */}
          <div className="relative flex-1 px-6 pb-8 pt-8 sm:px-10 sm:pt-12 lg:pt-16">
            <h1 className="max-w-2xl text-3xl font-black leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.9rem]">
              Znajdź najbliższą aptekę, sprawdź dyżur i zobacz co oferuje apteka.
            </h1>
            <p className="mt-3 max-w-md text-sm font-semibold text-ink-soft sm:text-base">
              Wszystkie apteki w Twojej okolicy w jednym miejscu.
            </p>
          </div>
        </div>

        {/* KARTY — trzy osobne panele; boczne przerwy, by nie stykały się z krawędziami ekranu */}
        <div className="mt-2.5 grid gap-2.5 px-3 sm:mt-3.5 sm:grid-cols-3 sm:gap-3.5 sm:px-5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={c.onClick}
                disabled={c.loading}
                style={{ "--card-color": c.color } as CSSProperties}
                className="pressable group relative block overflow-hidden rounded-[1.25rem] border border-line bg-surface text-left shadow-[var(--shadow-card)] transition-colors duration-500 hover:border-[var(--card-color)] disabled:opacity-70"
              >
                {/* WARSTWA SPOCZYNKOWA (biała) — wyjeżdża w górę na hover */}
                <div className="flex items-center gap-3.5 px-5 py-6 transition-transform duration-500 group-hover:-translate-y-[150%] sm:px-6 sm:py-7">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--card-color)] text-white shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-black tracking-wide text-ink sm:text-xl">
                      {c.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-soft">
                      {c.loading ? "Ustalanie lokalizacji…" : c.desc}
                    </span>
                  </span>
                </div>

                {/* WARSTWA HOVER — wjeżdża z dołu; skośny kolorowy fill wypełnia tło,
                    tekst i kółko w wersji „na kolorze" (biały). */}
                <div className="absolute inset-0 flex translate-y-full items-center gap-3.5 px-5 py-6 text-white transition-transform duration-500 group-hover:translate-y-0 sm:px-6 sm:py-7">
                  <span
                    aria-hidden
                    className="absolute inset-0 translate-y-full skew-y-12 scale-y-0 bg-[var(--card-color)] transition duration-500 group-hover:translate-y-0 group-hover:scale-150"
                  />
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[var(--card-color)] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="block text-lg font-black tracking-wide sm:text-xl">
                      {c.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-white/90">
                      {c.loading ? "Ustalanie lokalizacji…" : c.desc}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {(navError || geoError) && (
          <p className="mt-2.5 px-1 text-sm font-semibold text-danger" role="alert">
            {navError ?? geoError}
          </p>
        )}
      </div>
    </div>
  );
}
