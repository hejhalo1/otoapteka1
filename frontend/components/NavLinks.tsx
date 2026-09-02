"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Home, Info, MapPin, Search } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

// Nawigacja „grounded": zwykłe czarne linki (bez pigułek). Trzy landingi:
// Strona główna · Wyszukaj (apteki wg województw/miast) · O nas. Ulubione i „Moja
// lokalizacja" wyniesione do prawego klastra (patrz Header). Aktywna = podkreślenie.
const NAV_ITEMS = [
  { name: "Strona główna", url: "/", icon: Home },
  { name: "Wyszukaj", url: "/apteki", icon: Search },
  { name: "O nas", url: "/o-serwisie", icon: Info },
];

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn("flex items-center gap-1 text-sm font-semibold sm:gap-4", className)}
      aria-label="Nawigacja"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
        const Icon = item.icon;
        return (
          <Link
            key={item.url}
            href={item.url}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable flex items-center gap-1.5 rounded-lg px-2 py-2 text-ink transition-colors",
              active
                ? "underline decoration-ink decoration-2 underline-offset-[6px]"
                : "hover:text-ink/55",
            )}
          >
            <Icon className="h-4 w-4 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
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

/**
 * „Moja lokalizacja" — na stronie głównej uruchamia geolokalizację (event, który
 * łapie HomeSearch); z podstron wraca na główną z flagą ?lokalizuj=1.
 */
export function LocateButton() {
  const pathname = usePathname();
  const router = useRouter();
  const onClick = () => {
    if (pathname === "/") window.dispatchEvent(new Event("otoapteka:locate"));
    else router.push("/?lokalizuj=1");
  };
  return (
    <button
      onClick={onClick}
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
