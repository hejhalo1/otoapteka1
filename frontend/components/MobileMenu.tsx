"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Info, Menu, Search, Store, X } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { FontScale } from "./FontScale";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Strona główna", url: "/", icon: Home },
  { name: "Wyszukaj apteki", url: "/apteki", icon: Search },
  { name: "O nas", url: "/o-serwisie", icon: Info },
];

/**
 * Menu mobilne: ikona „hamburgera" na maksa po prawej, po kliknięciu wysuwa się
 * panel z prawej strony (nawigacja + Ulubione + Dla aptek + rozmiar tekstu).
 * Widoczne tylko poniżej `md` (na desktopie działa pełna nawigacja w headerze).
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const favorites = useFavorites();

  // Blokada scrolla tła + zamykanie Escape — tylko gdy panel otwarty.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Otwórz menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="pressable grid h-11 w-11 place-items-center rounded-sm border-2 border-ink/15 bg-surface text-ink transition-colors hover:border-pharma hover:text-pharma"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <>
          {/* Tło przyciemniające — klik zamyka */}
          <div
            className="animate-overlay-in fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm md:hidden"
            onClick={close}
            aria-hidden
          />

          {/* Panel wysuwany z prawej */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="animate-drawer-in fixed right-0 top-0 z-50 flex h-full w-[min(20rem,86vw)] flex-col bg-surface shadow-[var(--shadow-pop)] md:hidden"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <span className="text-sm font-black uppercase tracking-wide text-ink-soft">Menu</span>
              <button
                type="button"
                onClick={close}
                aria-label="Zamknij menu"
                className="pressable grid h-10 w-10 place-items-center rounded-sm text-ink transition-colors hover:bg-bg"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-3" aria-label="Nawigacja">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-base font-bold transition-colors",
                      active
                        ? "bg-pharma-soft text-pharma-dark"
                        : "text-ink hover:bg-bg",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {item.name}
                  </Link>
                );
              })}

              <Link
                href="/ulubione"
                onClick={close}
                aria-current={isActive("/ulubione") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-base font-bold transition-colors",
                  isActive("/ulubione") ? "bg-pharma-soft text-pharma-dark" : "text-ink hover:bg-bg",
                )}
              >
                <Heart className="h-5 w-5 shrink-0" aria-hidden />
                Ulubione
                {favorites.length > 0 && (
                  <span className="ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-danger px-1.5 text-xs font-extrabold text-white">
                    {favorites.length > 99 ? "99+" : favorites.length}
                  </span>
                )}
              </Link>
            </nav>

            <div className="mt-auto space-y-4 border-t border-line p-4">
              <Link
                href="/login"
                onClick={close}
                className="pressable flex items-center justify-center gap-2 rounded-md bg-pharma px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-pharma-dark"
              >
                <Store className="h-4 w-4" aria-hidden />
                Dla aptek
              </Link>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                  Rozmiar tekstu
                </p>
                <FontScale className="flex" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
