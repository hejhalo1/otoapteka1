import {
  CalendarDays,
  Clock,
  FlaskConical,
  type LucideIcon,
  Megaphone,
  Pill,
  Sparkles,
  Stethoscope,
  Syringe,
} from "lucide-react";

// Kategoryzacja komunikatów WIZUALNIE — ikona + „grounded" kolor akcentu (niebieskie /
// morskie / zielone + jeden pomarańczowy). Nazwa kategorii bierzemy z ANNOUNCEMENT_LABELS.
export const ANNOUNCEMENT_META: Record<string, { icon: LucideIcon; color: string }> = {
  PRODUCT_INFO: { icon: Pill, color: "#0e7490" }, // Dostępność leku — morski
  HOURS_CHANGE: { icon: Clock, color: "#c2410c" }, // Zmiana godzin — pomarańczowy
  VACCINATION: { icon: Syringe, color: "#0284c7" }, // Szczepienia — jasny niebieski
  CONSULTATION: { icon: Stethoscope, color: "#0369a1" }, // Konsultacje — niebieski
  SCREENING: { icon: FlaskConical, color: "#155e75" }, // Badania — ciemny morski
  NEW_SERVICE: { icon: Sparkles, color: "#15803d" }, // Nowa usługa — zielony
  EVENT: { icon: CalendarDays, color: "#047857" }, // Wydarzenie — ciemna zieleń
  ORG_NOTICE: { icon: Megaphone, color: "#0b4f9e" }, // Komunikat — granatowy
};

export const FALLBACK_ANNOUNCEMENT_META = { icon: Megaphone, color: "#0b4f9e" };

export const announcementMeta = (type: string) =>
  ANNOUNCEMENT_META[type] ?? FALLBACK_ANNOUNCEMENT_META;
