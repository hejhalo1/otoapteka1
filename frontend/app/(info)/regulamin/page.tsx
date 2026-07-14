import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin korzystania z serwisu otoapteka.pl.",
  alternates: { canonical: "/regulamin" },
};

export default function TermsPage() {
  return (
    <>
      <h1>Regulamin</h1>

      <h2>1. Charakter serwisu</h2>
      <p>
        otoapteka.pl jest bezpłatnym lokalizatorem aptek. Serwis nie prowadzi sprzedaży
        produktów leczniczych ani nie pośredniczy w ich zakupie.
      </p>

      <h2>2. Charakter informacyjny danych</h2>
      <p>
        Informacje o aptekach (w tym godziny otwarcia i status otwarcia) mają charakter
        informacyjny i pochodzą z publicznego rejestru oraz od aptek. Dokładamy starań, aby
        były aktualne, jednak przed wizytą — zwłaszcza w porze nocnej lub świątecznej —
        zalecamy kontakt telefoniczny z apteką.
      </p>

      <h2>3. Konta aptek</h2>
      <p>
        Właściciele aptek mogą uzyskać dostęp do panelu po weryfikacji. Treści dodawane przez
        apteki (komunikaty, zdjęcia) podlegają moderacji i muszą być zgodne z prawem.
      </p>

      <h2>4. Odpowiedzialność</h2>
      <p>
        Serwis nie ponosi odpowiedzialności za decyzje podjęte na podstawie prezentowanych
        informacji. Dane urzędowe pochodzą ze źródeł zewnętrznych.
      </p>

      <h2>5. Kontakt</h2>
      <p>kontakt@otoapteka.pl</p>
    </>
  );
}
