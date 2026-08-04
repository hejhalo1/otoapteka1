import type { OpenState, OpenStatus } from "./types";

// Dystans: < 1 km w metrach, dalej w km. Separator dziesiętny po polsku (przecinek).
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = (meters / 1000).toFixed(meters < 10000 ? 1 : 0);
  return `${km.replace(".", ",")} km`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const DAY_NAMES = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];
export const DAY_SHORT = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

// dzień tygodnia 0=pn..6=nd dla daty ISO (YYYY-MM-DD) w strefie lokalnej PL.
export function isoToDow(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(iso));
}

// Wygląd statusu: kolor + ikona (emoji) + tekst — nigdy sam kolor (dostępność).
export interface StatusMeta {
  label: string;
  className: string; // klasy tła/tekstu
  dot: string; // kolor kropki
  icon: string;
}

export function statusMeta(status: OpenStatus): StatusMeta {
  const map: Record<OpenState, StatusMeta> = {
    OPEN: {
      label: status.closesAt ? `Otwarte do ${formatTime(status.closesAt)}` : "Otwarte",
      className: "bg-open/10 text-open",
      dot: "bg-open",
      icon: "✓",
    },
    CLOSING_SOON: {
      label: status.closesAt ? `Zamyka się o ${formatTime(status.closesAt)}` : "Zamyka się wkrótce",
      className: "bg-warn/10 text-warn",
      dot: "bg-warn",
      icon: "!",
    },
    CLOSED: {
      label: status.opensNextAt
        ? `Zamknięte · otwarcie ${formatTime(status.opensNextAt)}`
        : "Zamknięte",
      className: "bg-danger/10 text-danger",
      dot: "bg-danger",
      icon: "×",
    },
    UNKNOWN: {
      label: "Godziny nieznane",
      className: "bg-muted/10 text-muted",
      dot: "bg-muted",
      icon: "?",
    },
  };
  const meta = map[status.state];
  if (status.isDuty && (status.state === "OPEN" || status.state === "CLOSING_SOON")) {
    return { ...meta, label: `Dyżur · ${meta.label}` };
  }
  return meta;
}

export const ANNOUNCEMENT_LABELS: Record<string, string> = {
  PRODUCT_INFO: "Dostępność leku",
  HOURS_CHANGE: "Zmiana godzin",
  VACCINATION: "Szczepienia",
  CONSULTATION: "Konsultacje",
  SCREENING: "Badania",
  NEW_SERVICE: "Nowa usługa",
  EVENT: "Wydarzenie",
  ORG_NOTICE: "Komunikat",
};

export function navigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
