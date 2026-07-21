import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O serwisie",
  description:
    "otoapteka.pl to lokalizator aptek klasy premium — nie sklep i nie porównywarka cen. Znajdź najbliższą, aktualnie otwartą aptekę.",
  alternates: { canonical: "/o-serwisie" },
};

export default function AboutPage() {
  return (
    <>
      <h1>O serwisie</h1>
      <p>
        <strong>otoapteka.pl</strong> to lokalizator aptek w Polsce. Nie jesteśmy sklepem
        ani porównywarką cen — pomagamy w kilka sekund znaleźć najbliższą, aktualnie otwartą
        aptekę, sprawdzić dystans, czas dojścia i dojazdu oraz godziny otwarcia.
      </p>

      <h2>Skąd pochodzą dane</h2>
      <ul>
        <li>
          Dane urzędowe aptek (nazwa, adres, godziny) pochodzą z Rejestru Aptek prowadzonego
          przez Centrum e-Zdrowia i publikowanego na dane.gov.pl. Aktualizujemy je codziennie.
        </li>
        <li>
          Współrzędne aptek wyznaczamy z oficjalnej bazy adresowej PRG (usługa geokodowania
          GUGiK), a mapy i wyznaczanie tras opieramy o ekosystem OpenStreetMap —
          © OpenStreetMap contributors.
        </li>
        <li>
          Apteki mogą dodać do swojej wizytówki dodatkowe informacje (opis, usługi, komunikaty)
          po zweryfikowaniu, że są właścicielem profilu.
        </li>
      </ul>

      <h2>Twoja prywatność</h2>
      <p>
        Twoja lokalizacja jest używana wyłącznie po Twoim kliknięciu i nigdy nie jest
        zapisywana ani przekazywana dalej. Szczegóły znajdziesz w{" "}
        <a href="/polityka-prywatnosci" className="font-semibold text-primary underline">
          Polityce prywatności
        </a>
        .
      </p>
    </>
  );
}
