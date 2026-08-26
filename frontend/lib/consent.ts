// Zgoda na ciasteczka (localStorage). Kategorie u nas: niezbędne (zawsze) +
// funkcjonalne (zapamiętanie lokalizacji/ustawień). Analityki/marketingu NIE mamy,
// więc ich nie deklarujemy.

export interface ConsentState {
  /** Czy użytkownik podjął już decyzję (baner się nie pokazuje). */
  decided: boolean;
  /** Zgoda na ciasteczka funkcjonalne (np. zapamiętanie lokalizacji). */
  functional: boolean;
}

const CONSENT_KEY = "otoapteka:cookie-consent"; // "all" | "necessary"
const PREFS_KEY = "otoapteka:cookie-prefs"; // JSON { functional: boolean }
export const CONSENT_EVENT = "otoapteka:consent";

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return { decided: false, functional: false };
  try {
    const decided = localStorage.getItem(CONSENT_KEY) != null;
    if (!decided) return { decided: false, functional: false };
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return { decided: true, functional: !!prefs.functional };
  } catch {
    return { decided: false, functional: false };
  }
}

export function writeConsent(functional: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, functional ? "all" : "necessary");
    localStorage.setItem(PREFS_KEY, JSON.stringify({ functional }));
    window.dispatchEvent(
      new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: { decided: true, functional } }),
    );
  } catch {
    /* pamięć niedostępna — trudno */
  }
}

export function hasFunctionalConsent(): boolean {
  return readConsent().functional;
}
