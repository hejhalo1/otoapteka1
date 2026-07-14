import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-semibold text-ink">otoapteka.pl</span>
          <Link href="/o-serwisie" className="hover:text-ink">O serwisie</Link>
          <Link href="/regulamin" className="hover:text-ink">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="hover:text-ink">Polityka prywatności</Link>
        </div>
        <p className="mt-4 text-xs">
          Dane aptek: Rejestr Aptek (Centrum e-Zdrowia, dane.gov.pl). Mapy i geokodowanie:
          © OpenStreetMap contributors. Lokalizacja użytkownika nie jest zapisywana ani
          przekazywana dalej.
        </p>
      </div>
    </footer>
  );
}
