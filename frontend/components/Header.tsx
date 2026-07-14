import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="pressable flex items-center gap-2" aria-label="otoapteka.pl — strona główna">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-surface font-bold">
            +
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">
            otoapteka<span className="text-teal">.pl</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/mapa"
            className="pressable rounded-lg px-3 py-2 text-ink-soft hover:bg-bg hover:text-ink"
          >
            Mapa
          </Link>
          <Link
            href="/o-serwisie"
            className="pressable rounded-lg px-3 py-2 text-ink-soft hover:bg-bg hover:text-ink"
          >
            O serwisie
          </Link>
        </nav>
      </div>
    </header>
  );
}
