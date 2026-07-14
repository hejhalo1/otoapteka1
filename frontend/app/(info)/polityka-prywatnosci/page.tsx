import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Jak otoapteka.pl przetwarza dane. Lokalizacja użytkownika nie jest zapisywana ani logowana.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Polityka prywatności</h1>

      <h2>Lokalizacja</h2>
      <p>
        Geolokalizacja przeglądarki (HTML5) uruchamiana jest wyłącznie po Twoim wyraźnym
        działaniu — nigdy automatycznie. Współrzędne są używane jedynie w pamięci, do zapytania
        o najbliższe apteki, i <strong>nie są zapisywane</strong> (brak localStorage, brak
        wysyłki poza to zapytanie) ani logowane po stronie serwera. Możesz zamiast tego wybrać
        miasto z listy lub wskazać punkt na mapie.
      </p>

      <h2>Cookies i śledzenie</h2>
      <p>
        Serwis publiczny nie stosuje śledzących plików cookie. Konta aptek i administracji
        używają wyłącznie technicznych ciasteczek niezbędnych do zalogowania.
      </p>

      <h2>Dane aptek</h2>
      <p>
        Prezentowane dane aptek pochodzą z publicznego Rejestru Aptek (dane.gov.pl) oraz z
        informacji dodanych przez zweryfikowane apteki.
      </p>

      <h2>Usługi zewnętrzne</h2>
      <p>
        Do wyświetlania map i geokodowania korzystamy z OpenStreetMap oraz Nominatim.
        Ładowanie kafelków mapy wiąże się z zapytaniem do dostawcy kafelków.
      </p>

      <h2>Kontakt</h2>
      <p>W sprawach prywatności: kontakt@otoapteka.pl.</p>
    </>
  );
}
