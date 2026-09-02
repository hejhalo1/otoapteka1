import Link from "next/link";
import { Store } from "lucide-react";
import { LogoMark, Wordmark } from "./Logo";
import { NavLinks, HeaderActions, BackIndicator, LocateButton } from "./NavLinks";
import { FontScale } from "./FontScale";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4">
        {/* Lewo: strzałka powrotu (tylko na podstronach) + logo z podpisem (zostaje) */}
        <div className="flex min-w-0 items-center gap-1.5">
          <BackIndicator />
          <Link
            href="/"
            className="pressable group flex shrink-0 items-center gap-2.5"
            aria-label="otoapteka.pl — strona główna"
          >
            <LogoMark className="h-11 drop-shadow-sm transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110" />
            <span className="hidden flex-col leading-tight min-[380px]:flex">
              <Wordmark />
              <span className="text-[11px] font-semibold text-ink-soft sm:text-xs">
                Wszystkie apteki. Aktualne informacje
              </span>
            </span>
          </Link>
        </div>

        <NavLinks className="hidden md:flex" />

        {/* Prawo (desktop, md+): Ulubione · A A A · Moja lokalizacja · Dla aptek */}
        <div className="hidden items-center gap-2 md:flex">
          <HeaderActions />
          <FontScale className="hidden md:flex" />
          <LocateButton />
          <Link
            href="/login"
            className="pressable inline-flex items-center gap-1.5 rounded-sm bg-pharma-soft px-3.5 py-2 text-sm font-bold text-pharma-dark transition-colors hover:bg-pharma hover:text-white"
          >
            <Store className="h-4 w-4" aria-hidden />
            Dla aptek
          </Link>
        </div>

        {/* Prawo (mobile, <md): ikona lokalizacji, a na maksa po prawej hamburger */}
        <div className="flex items-center gap-1.5 md:hidden">
          <LocateButton />
          <MobileMenu />
        </div>
      </div>

      {/* Cienkie pasmo lekko przyciemnionej bieli pod headerem — wyraźny koniec
          headera i start strony (miękki cień zamiast twardej kreski). */}
      <div
        aria-hidden
        className="pointer-events-none h-2.5 w-full bg-gradient-to-b from-ink/[0.08] to-transparent"
      />
    </header>
  );
}
