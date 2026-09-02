import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin korzystania z serwisu otoapteka.pl.",
  alternates: { canonical: "/regulamin" },
};

export default function TermsPage() {
  return (
    <>
      <h1>Regulamin serwisu otoapteka.pl</h1>
      <p className="lead">
        Niniejszy regulamin określa zasady korzystania z serwisu internetowego otoapteka.pl przez
        użytkowników oraz apteki.
      </p>
      <p className="updated">Ostatnia aktualizacja: 31 sierpnia 2026 r.</p>

      <h2>1. Definicje</h2>
      <ul>
        <li>
          <strong>Serwis</strong> to strona internetowa otoapteka.pl wraz z jej funkcjami.
        </li>
        <li>
          <strong>Usługodawca</strong> to podmiot prowadzący Serwis.
        </li>
        <li>
          <strong>Użytkownik</strong> to każda osoba korzystająca z Serwisu.
        </li>
        <li>
          <strong>Zweryfikowana apteka</strong> to placówka, której właściciel uzyskał dostęp do
          panelu i może zarządzać swoim profilem.
        </li>
      </ul>

      <h2>2. Zakres i charakter usługi</h2>
      <p>
        Serwis jest bezpłatnym lokalizatorem aptek. Umożliwia wyszukiwanie aptek oraz sprawdzanie
        ich godzin otwarcia, statusu otwarcia, dyżurów i informacji publikowanych przez apteki.
        Serwis nie prowadzi sprzedaży produktów leczniczych, nie pośredniczy w ich zakupie i nie
        udziela porad medycznych ani farmaceutycznych.
      </p>

      <h2>3. Charakter informacyjny danych</h2>
      <p>
        Informacje prezentowane w Serwisie, w tym godziny i status otwarcia, mają charakter
        informacyjny. Pochodzą z publicznych rejestrów oraz od aptek i mogą różnić się od stanu
        faktycznego. Przed wizytą, w szczególności w porze nocnej, w niedziele i święta, zalecamy
        potwierdzenie informacji bezpośrednio w aptece. Usługodawca nie ponosi odpowiedzialności za
        decyzje podjęte na podstawie prezentowanych informacji.
      </p>

      <h2>4. Konta aptek</h2>
      <p>
        Właściciel apteki może uzyskać dostęp do panelu po weryfikacji uprawnień do danego profilu i
        zobowiązany jest do podawania prawdziwych oraz aktualnych informacji. Treści publikowane
        przez apteki (opisy, zdjęcia, komunikaty) podlegają moderacji, muszą być zgodne z prawem i
        nie mogą wprowadzać w błąd. Usługodawca może odmówić publikacji lub usunąć treści naruszające
        te zasady albo dobre obyczaje.
      </p>

      <h2>5. Prawa autorskie i licencje danych</h2>
      <p>
        Dane urzędowe pochodzą z otwartych zasobów publicznych (Rejestr Aptek, dane.gov.pl) i są
        wykorzystywane zgodnie z warunkami ich udostępniania. Dane mapowe pochodzą z projektu
        OpenStreetMap i objęte są licencją ODbL (© OpenStreetMap contributors), a geokodowanie
        opieramy o usługi GUGiK. Układ, wygląd i oprogramowanie Serwisu stanowią własność
        Usługodawcy.
      </p>

      <h2>6. Reklamacje i kontakt</h2>
      <p>
        Uwagi, zgłoszenia błędów w danych oraz reklamacje można kierować na adres
        kontakt@otoapteka.pl. Odpowiadamy w rozsądnym terminie. Zasady przetwarzania danych
        osobowych opisuje <a href="/polityka-prywatnosci">Polityka prywatności</a>.
      </p>

      <h2>7. Zmiany regulaminu</h2>
      <p>
        Usługodawca może zmienić regulamin z ważnych przyczyn, na przykład w związku ze zmianą
        funkcji Serwisu lub przepisów prawa. Aktualna wersja jest zawsze dostępna na tej stronie.
      </p>
    </>
  );
}
