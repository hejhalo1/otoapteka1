"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Heart, Info, Map as MapIcon, Search } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Strona główna", url: "/", icon: Search },
  { name: "Apteki wg miast", url: "/apteki", icon: Building2 },
  { name: "Mapa", url: "/mapa", icon: MapIcon },
  { name: "O serwisie", url: "/o-serwisie", icon: Info },
];

/**
 * Nawigacja: zwykłe przyciski (bez pigułki/układu). Aktywna podstrona → niebieskie
 * tło + biały napis; hover na inną → lekkie jasnoniebieskie tło; domyślnie białe tło.
 */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-1.5">
      {NAV_ITEMS.map((item) => {
        const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
        const Icon = item.icon;
        return (
          <Link
            key={item.url}
            href={item.url}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors sm:px-3",
              active
                ? "bg-pharma text-white"
                : "bg-white text-ink-soft hover:bg-pharma-soft hover:text-pharma-dark",
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

/** Prawa strona headera: ulubione (z licznikiem) i wejście do panelu apteki. */
export function HeaderActions() {
  const favorites = useFavorites();
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/ulubione"
        aria-label={`Ulubione apteki${favorites.length ? ` (${favorites.length})` : ""}`}
        title="Ulubione apteki"
        className="pressable relative grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-danger/10 hover:text-danger"
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
    </div>
  );
}
