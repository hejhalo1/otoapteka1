import Link from "next/link";
import { Check, Mail, Phone, Store } from "lucide-react";
import { LogoMark, Wordmark } from "./Logo";

// Kontakt serwisu. TODO: podmień na prawdziwy numer telefonu i adres e-mail.
const CONTACT = {
  phone: "+48 22 000 00 00",
  phoneHref: "tel:+48220000000",
  email: "kontakt@otoapteka.pl",
};

const BENEFITS = [
  "Bezpłatna wizytówka apteki",
  "Godziny otwarcia i dyżury zawsze aktualne",
  "Komunikaty i usługi prosto do pacjenta",
];

const SERWIS = [
  { label: "Apteki", href: "/apteki" },
  { label: "Ulubione", href: "/ulubione" },
];

const INFORMACJE = [
  { label: "O nas", href: "/o-serwisie" },
  { label: "Regulamin", href: "/regulamin" },
  { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-primary text-white">
      {/* ── Zachęta dla aptek (zamiast newslettera) ── */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr] lg:py-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
              <Store className="h-3.5 w-3.5" aria-hidden /> Dla aptek
            </span>
            <h2 className="mt-3 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
              Prowadzisz aptekę? Bądź widoczny, gdy pacjent Cię szuka.
            </h2>
            <p className="mt-3 max-w-xl text-white/80">
              Dodaj aptekę do otoapteka.pl bezpłatnie. Zadbaj o aktualne godziny, dyżury i
              komunikaty, a pacjenci z Twojej okolicy trafią prosto do Ciebie.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/rejestracja"
                className="pressable inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-bold text-pharma-dark transition-colors hover:bg-white/90"
              >
                Zarejestruj aptekę
              </Link>
              <Link
                href="/login"
                className="pressable inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 font-bold text-white transition-colors hover:bg-white/10"
              >
                Zaloguj się do panelu
              </Link>
            </div>
          </div>

          {/* Kontakt serwisu (telefon + e-mail zamiast pola newslettera) */}
          <div className="lg:justify-self-end">
            <p className="text-sm font-bold uppercase tracking-wide text-white/60">Masz pytania?</p>
            <p className="mt-2 text-sm text-white/75">
              Pomożemy z rejestracją apteki i weryfikacją profilu.
            </p>
            <div className="mt-4 space-y-3">
              <a
                href={CONTACT.phoneHref}
                className="group flex items-center gap-3 text-white transition-colors hover:text-white/80"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/10">
                  <Phone className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-lg font-bold tabular-nums">{CONTACT.phone}</span>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="group flex items-center gap-3 text-white transition-colors hover:text-white/80"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/10">
                  <Mail className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-lg font-bold">{CONTACT.email}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logo + nawigacja ── */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Link href="/" className="pressable inline-flex items-center gap-2.5" aria-label="otoapteka.pl">
            <LogoMark variant="onDark" className="h-10" />
            <Wordmark tone="onDark" className="text-xl" />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-white/70">
            Lokalizator aptek w Polsce. Najbliższa, aktualnie otwarta apteka, godziny i dyżury w
            jednym miejscu.
          </p>
        </div>

        <nav aria-label="Serwis">
          <p className="text-sm font-bold uppercase tracking-wide text-white/60">Serwis</p>
          <ul className="mt-4 space-y-2.5">
            {SERWIS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informacje">
          <p className="text-sm font-bold uppercase tracking-wide text-white/60">Informacje</p>
          <ul className="mt-4 space-y-2.5">
            {INFORMACJE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* ── Atrybucja danych + prawa autorskie ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-white/60 sm:flex sm:items-center sm:justify-between sm:text-left">
          <p>
            Dane aptek: Rejestr Aptek (Centrum e-Zdrowia, dane.gov.pl). Geokodowanie: GUGiK. Mapy: ©
            OpenStreetMap.
          </p>
          <p className="mt-2 sm:mt-0">© {year} otoapteka.pl. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
