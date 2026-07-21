import Link from "next/link";
import { LogoMark, Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark className="h-7" />
              <Wordmark className="text-lg" />
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed">
              Znajdź najbliższą otwartą aptekę — dystans, czas dojścia, godziny
              otwarcia i komunikaty. Twoja lokalizacja nigdy nie jest zapisywana
              ani przekazywana dalej.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 font-medium sm:grid-cols-1 sm:justify-items-start">
            <Link href="/mapa" className="link-underline hover:text-ink">Mapa aptek</Link>
            <Link href="/ulubione" className="link-underline hover:text-ink">Ulubione</Link>
            <Link href="/o-serwisie" className="link-underline hover:text-ink">O serwisie</Link>
            <Link href="/regulamin" className="link-underline hover:text-ink">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="link-underline hover:text-ink">
              Polityka prywatności
            </Link>
            <Link href="/login" className="link-underline hover:text-ink">Panel apteki</Link>
          </nav>
        </div>
        <p className="mt-8 border-t pt-4 text-xs">
          Dane aptek: Rejestr Aptek (Centrum e-Zdrowia, dane.gov.pl) · Geokodowanie: GUGiK /
          © OpenStreetMap contributors · Mapy: © OpenStreetMap
        </p>
      </div>
    </footer>
  );
}
