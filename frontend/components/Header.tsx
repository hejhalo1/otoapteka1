import Link from "next/link";
import { LogoMark, Wordmark } from "./Logo";
import { NavLinks, HeaderActions } from "./NavLinks";
import { FontScale } from "./FontScale";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="pressable group flex shrink-0 items-center gap-2.5"
          aria-label="otoapteka.pl — strona główna"
        >
          <LogoMark className="h-8 drop-shadow-sm transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110" />
          <Wordmark className="hidden min-[380px]:inline" />
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2">
          <FontScale />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
