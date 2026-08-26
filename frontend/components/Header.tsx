import Link from "next/link";
import { Store } from "lucide-react";
import { LogoMark, Wordmark } from "./Logo";
import { NavLinks, HeaderActions } from "./NavLinks";
import { FontScale } from "./FontScale";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4">
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

        <NavLinks />

        <div className="flex items-center gap-2">
          {/* „Dla aptek" — stały niebieski przycisk (hover ciemnieje) */}
          <Link
            href="/login"
            className="pressable hidden items-center gap-1.5 rounded-lg bg-pharma px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-pharma-dark sm:inline-flex"
          >
            <Store className="h-4 w-4" aria-hidden />
            Dla aptek
          </Link>
          <FontScale />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
