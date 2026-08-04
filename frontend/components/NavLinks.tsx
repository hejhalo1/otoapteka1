"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Info, Map as MapIcon, Search, Store, UserRound } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Znajdź aptekę", Icon: Search },
  { href: "/mapa", label: "Mapa", Icon: MapIcon },
  { href: "/login", label: "Dla aptek", Icon: Store },
  { href: "/o-serwisie", label: "O serwisie", Icon: Info },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-0.5 text-sm font-semibold sm:gap-1">
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable group relative rounded-lg px-2.5 py-2 text-ink-soft transition-colors hover:text-ink sm:px-3",
              active && "text-ink",
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </span>
            {/* Animowane podkreślenie — rośnie od środka. */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-2.5 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-pharma transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:scale-x-100",
                active && "scale-x-100",
              )}
            />
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
      <Link
        href="/login"
        aria-label="Konto apteki — logowanie"
        title="Konto apteki"
        className="pressable grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-pharma-soft hover:text-pharma-dark"
      >
        <UserRound className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  );
}
