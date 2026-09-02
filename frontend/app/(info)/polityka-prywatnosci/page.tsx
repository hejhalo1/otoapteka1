import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Jak otoapteka.pl przetwarza dane. Lokalizacja nie jest wysyłana na serwer, a jej zapamiętanie w przeglądarce wymaga Twojej zgody.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Polityka prywatności</h1>
      <p className="lead">
        Wyjaśniamy, jakie dane przetwarza otoapteka.pl, w jakim celu i na jakich zasadach. Serwis
        zaprojektowaliśmy tak, aby zbierać możliwie najmniej danych.
      </p>
      <p className="updated">Ostatnia aktualizacja: 31 sierpnia 2026 r.</p>

      <h2>Administrator danych</h2>
      <p>
        Administratorem danych jest podmiot prowadzący serwis otoapteka.pl. W sprawach dotyczących
        prywatności i danych osobowych napisz na kontakt@otoapteka.pl.
      </p>

      <h2>Twoja lokalizacja</h2>
      <p>
        Geolokalizacja przeglądarki uruchamiana jest wyłącznie po Twoim wyraźnym działaniu, nigdy
        automatycznie. Współrzędne służą jedynie do znalezienia najbliższych aptek i{" "}
        <strong>nie są wysyłane na nasz serwer</strong> poza pojedynczym zapytaniem o listę aptek w
        okolicy. Zamiast udostępniać lokalizację, możesz wybrać miejscowość z listy lub wskazać punkt
        na mapie.
      </p>

      <h2>Zapamiętywanie lokalizacji w przeglądarce</h2>
      <p>
        Dla wygody możemy zapamiętać Twoją ostatnią lokalizację w pamięci przeglądarki (localStorage),
        abyś nie musiał podawać jej ponownie. Dzieje się to{" "}
        <strong>tylko po wyrażeniu przez Ciebie zgody</strong> w banerze zgód. Dane te pozostają na
        Twoim urządzeniu, nie trafiają do nas i możesz je w każdej chwili usunąć, czyszcząc dane
        witryny lub cofając zgodę.
      </p>

      <h2>Pliki cookie i zgody</h2>
      <p>Publiczna część serwisu nie stosuje śledzących ani reklamowych plików cookie. Używamy jedynie:</p>
      <ul>
        <li>zgody funkcjonalnej zapisanej w Twojej przeglądarce, która decyduje o zapamiętywaniu lokalizacji,</li>
        <li>technicznych mechanizmów niezbędnych do logowania w panelu aptek i panelu administracji.</li>
      </ul>

      <h2>Dane aptek i kont</h2>
      <p>
        Dane aptek prezentowane w serwisie pochodzą z publicznego Rejestru Aptek oraz z informacji
        dodanych przez zweryfikowane apteki. Zakładając konto apteki, podajesz dane niezbędne do jego
        prowadzenia, na przykład adres e-mail. Przetwarzamy je wyłącznie w celu obsługi konta i
        weryfikacji.
      </p>

      <h2>Usługi zewnętrzne</h2>
      <p>
        Do wyświetlania map i wyznaczania lokalizacji korzystamy z zewnętrznych dostawców (kafelki map
        oparte o OpenStreetMap oraz CARTO, geokodowanie GUGiK i Nominatim). Wczytanie mapy wiąże się z
        zapytaniem do dostawcy kafelków, który może odnotować adres IP wynikający z samego połączenia.
        Nie przekazujemy tym dostawcom Twoich danych identyfikujących.
      </p>

      <h2>Twoje prawa</h2>
      <p>
        Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia oraz ograniczenia lub
        sprzeciwu wobec przetwarzania. Ponieważ w części publicznej nie tworzymy Twojego profilu ani
        nie zapisujemy lokalizacji po swojej stronie, w praktyce większość danych pozostaje wyłącznie
        na Twoim urządzeniu. Aby zrealizować swoje prawa, napisz na kontakt@otoapteka.pl.
      </p>

      <h2>Kontakt</h2>
      <p>
        W sprawach prywatności: kontakt@otoapteka.pl. Zasady korzystania z serwisu opisuje{" "}
        <a href="/regulamin">Regulamin</a>.
      </p>
    </>
  );
}
