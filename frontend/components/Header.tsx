import Link from "next/link";
import { LogoMark, Wordmark } from "./Logo";
import { NavLinks, LocateButton } from "./NavLinks";
import { FontScale } from "./FontScale";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="pressable flex shrink-0 items-center gap-2.5"
          aria-label="OtoApteka.pl — strona główna"
        >
          <LogoMark className="h-8 drop-shadow-sm" />
          <Wordmark className="hidden min-[380px]:inline" />
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2">
          <FontScale />
          <LocateButton />
        </div>
      </div>
    </header>
  );
}
