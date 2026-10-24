"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Home, Info, MapPin, Search, X } from "lucide-react";
import { reverseCity } from "@/lib/api";
import type { Coords } from "@/lib/geo";
import { clearLastLocation, readLastLocation } from "@/lib/last-location";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import LinkButton from "@/components/ui/link-button";

// Nawigacja: efekt „LinkButton" (podkreślenie wjeżdżające na hover + ikona
// reprezentująca stronę, obracająca się -45° jak strzałka). Trzy landingi, bez
// osobnego wskaźnika aktywnej strony.
const NAV_ITEMS = [
  { name: "Strona główna", url: "/", icon: Home },
  { name: "Wyszukaj", url: "/apteki", icon: Search },
  { name: "O nas", url: "/o-serwisie", icon: Info },
];

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav
      className={cn("flex items-center gap-4 text-ink sm:gap-6", className)}
      aria-label="Nawigacja"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
        return (
          <LinkButton
            key={item.url}
            href={item.url}
            btnText={item.name}
            mobileText={item.name}
            compact={false}
            icon={item.icon}
            textColor="currentColor"
            hoverColor="#0b4f9e"
            underlineHeight={2}
            sizeClassName="text-sm"
            iconSizeClassName="size-4"
            className="font-semibold"
            aria-current={active ? "page" : undefined}
            // Zachowujemy nawigację SPA (router.push), ale nie psujemy otwierania w nowej
            // karcie: przy Ctrl/Cmd/Shift/Alt lub kliknięciu środkowym zostawiamy href.
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              router.push(item.url);
            }}
          />
        );
      })}
    </nav>
  );
}

/** Strzałka ← na podstronach (na stronie głównej znika) — powrót do „/". */
export function BackIndicator() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <Link
      href="/"
      aria-label="Wróć na stronę główną"
      title="Wróć"
      className="pressable grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink transition-colors hover:bg-bg"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </Link>
  );
}

// Cache reverse-geocode w obrębie sesji (współdzielony przez oba egzemplarze przycisku).
const cityCache = new Map<string, string | null>();

/**
 * „Moja lokalizacja". Gdy nie znamy lokalizacji — przycisk uruchamia geolokalizację
 * (event łapany przez HomeSearch; z podstron wraca na główną z ?lokalizuj=1). Gdy
 * lokalizacja jest ustawiona — pokazuje miasto (reverse geocode) i czerwony „×"
 * do jej usunięcia.
 */
export function LocateButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [loc, setLoc] = useState<Coords | null>(null);
  const [city, setCity] = useState<string | null>(null);

  // Odczyt zapisanej lokalizacji + nasłuch ustalenia / wyczyszczenia (z innych miejsc).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoc(readLastLocation());
    const onLocated = (e: Event) =>
      setLoc((e as CustomEvent<Coords>).detail ?? readLastLocation());
    const onCleared = () => {
      setLoc(null);
      setCity(null);
    };
    window.addEventListener("otoapteka:located", onLocated);
    window.addEventListener("otoapteka:location-cleared", onCleared);
    return () => {
      window.removeEventListener("otoapteka:located", onLocated);
      window.removeEventListener("otoapteka:location-cleared", onCleared);
    };
  }, []);

  // Ustal nazwę miasta dla bieżącej lokalizacji (z cache lub reverse geocode).
  useEffect(() => {
    if (!loc) return;
    const key = `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
    if (cityCache.has(key)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCity(cityCache.get(key) ?? null);
      return;
    }
    const ctrl = new AbortController();
    let alive = true;
    void reverseCity(loc.lat, loc.lng, ctrl.signal).then((c) => {
      cityCache.set(key, c);
      if (alive) setCity(c);
    });
    return () => {
      alive = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.lat, loc?.lng]);

  const onLocate = () => {
    if (pathname === "/") window.dispatchEvent(new Event("otoapteka:locate"));
    else router.push("/?lokalizuj=1");
  };
  const clear = () => {
    clearLastLocation();
    setLoc(null);
    setCity(null);
    window.dispatchEvent(new Event("otoapteka:location-cleared"));
  };

  if (loc) {
    return (
      <div className="inline-flex shrink-0 items-center gap-1 rounded-sm border-2 border-ink/15 bg-surface py-1 pl-2.5 pr-1">
        <button
          onClick={onLocate}
          title="Zmień lokalizację"
          className="pressable inline-flex items-center gap-1.5 text-sm font-bold text-ink transition-colors hover:text-pharma"
        >
          <MapPin className="h-4 w-4 shrink-0 text-pharma" aria-hidden />
          <span className="hidden max-w-[9rem] truncate sm:inline">
            {city ?? loc.label ?? "Twoja lokalizacja"}
          </span>
        </button>
        <button
          onClick={clear}
          aria-label="Usuń lokalizację"
          title="Usuń lokalizację"
          className="pressable grid h-6 w-6 shrink-0 place-items-center rounded-full bg-transparent text-danger transition-colors hover:bg-danger/10"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLocate}
      className="pressable inline-flex shrink-0 items-center gap-2 rounded-sm border-2 border-ink/15 bg-surface px-3.5 py-2 text-sm font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
    >
      <MapPin className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Moja lokalizacja</span>
    </button>
  );
}

/** Ulubione — serce z licznikiem, na maksa po prawo. */
export function HeaderActions() {
  const favorites = useFavorites();
  return (
    <Link
      href="/ulubione"
      aria-label={`Ulubione apteki${favorites.length ? ` (${favorites.length})` : ""}`}
      title="Ulubione apteki"
      className="pressable relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-danger/10 hover:text-danger"
    >
      <Heart className="h-5 w-5" aria-hidden />
      {favorites.length > 0 && (
        <span
          aria-hidden
          className="animate-num-in absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-0.5 text-[10px] font-extrabold text-white"
        >
          {favorites.length > 9 ? "9+" : favorites.length}
        </span>
      )}
    </Link>
  );
}
