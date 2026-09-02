import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O nas",
  description:
    "otoapteka.pl to bezpłatny lokalizator aptek w Polsce. Sprawdź, która apteka jest najbliżej i aktualnie otwarta.",
  alternates: { canonical: "/o-serwisie" },
};

export default function AboutPage() {
  return (
    <>
      <h1>O serwisie otoapteka.pl</h1>
      <p className="lead">
        otoapteka.pl to bezpłatny lokalizator aptek w Polsce. W kilka sekund pokazujemy, która
        apteka jest najbliżej, czy jest teraz otwarta i jak szybko do niej dotrzesz. Nie prowadzimy
        sprzedaży leków ani nie porównujemy cen.
      </p>

      <h2>Co znajdziesz w serwisie</h2>
      <ul>
        <li>Najbliższe apteki wraz z dystansem oraz szacowanym czasem dojścia i dojazdu.</li>
        <li>
          Aktualny status otwarcia liczony na bieżąco, na podstawie godzin pracy i harmonogramu
          dyżurów.
        </li>
        <li>
          Pełne godziny otwarcia na każdy dzień tygodnia oraz informacje o dyżurach nocnych i
          świątecznych.
        </li>
        <li>
          Komunikaty i usługi publikowane bezpośrednio przez apteki, na przykład szczepienia,
          pomiar ciśnienia czy rezerwacja leków.
        </li>
        <li>Wyszukiwanie aptek według miejscowości oraz przeglądanie ich na mapie.</li>
      </ul>

      <h2>Skąd pochodzą dane</h2>
      <p>Łączymy oficjalne źródła publiczne z informacjami przekazywanymi przez same apteki:</p>
      <ul>
        <li>
          <strong>Dane urzędowe</strong> (nazwa, adres, godziny) pochodzą z Rejestru Aptek
          prowadzonego przez Centrum e-Zdrowia i publikowanego na dane.gov.pl. Synchronizujemy je
          codziennie.
        </li>
        <li>
          <strong>Lokalizacje na mapie</strong> wyznaczamy z oficjalnej bazy adresowej (usługa
          geokodowania GUGiK), a mapy opieramy o dane OpenStreetMap.
        </li>
        <li>
          <strong>Informacje od aptek</strong> (opis, zdjęcia, usługi, komunikaty, dyżury) dodają
          zweryfikowani właściciele profili. Treści te podlegają moderacji.
        </li>
      </ul>

      <h2>Dla aptek</h2>
      <p>
        Jeśli prowadzisz aptekę, możesz bezpłatnie przejąć swoją wizytówkę, zadbać o aktualne
        godziny i dyżury oraz publikować komunikaty dla pacjentów. Rejestracja i weryfikacja
        odbywają się w <a href="/rejestracja">panelu dla aptek</a>.
      </p>

      <h2>Prywatność</h2>
      <p>
        Twoją lokalizację wykorzystujemy wyłącznie po Twoim kliknięciu, aby wskazać najbliższe
        apteki, i nigdy nie wysyłamy jej na nasz serwer. Szczegóły opisujemy w{" "}
        <a href="/polityka-prywatnosci">Polityce prywatności</a>.
      </p>

      <h2>Kontakt</h2>
      <p>
        Masz pytanie lub uwagę? Napisz na kontakt@otoapteka.pl. Zasady korzystania z serwisu opisuje{" "}
        <a href="/regulamin">Regulamin</a>.
      </p>
    </>
  );
}
