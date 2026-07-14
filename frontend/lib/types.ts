// Typy odpowiedzi API (mirror backendu).

export type OpenState = "OPEN" | "CLOSED" | "CLOSING_SOON" | "UNKNOWN";

export interface OpenStatus {
  state: OpenState;
  closesAt: string | null;
  opensNextAt: string | null;
  isDuty: boolean;
}

export interface DayHours {
  dayOfWeek: number;
  opens: string;
  closes: string;
  is24h: boolean;
}

export interface PharmacyCard {
  id: string;
  slug: string;
  name: string;
  address: { street: string; city: string; postalCode: string; voivodeship: string };
  phone: string | null;
  lat: number | null;
  lng: number | null;
  distanceMeters: number;
  walkMinutes: number;
  driveMinutes: number;
  openStatus: OpenStatus;
  hoursForDate: DayHours[];
  latestAnnouncement: { title: string; type: string; publishedAt: string | null } | null;
}

export interface PharmacyListResponse {
  data: PharmacyCard[];
  pagination: { page: number; perPage: number; total: number; hasMore: boolean };
  meta: { referenceTime: string; date: string };
}

export interface PharmacyDetail {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    voivodeship: string;
    county: string;
    commune: string;
  };
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  openStatus: OpenStatus;
  weekHours: { dayOfWeek: number; segments: DayHours[] }[];
  dutyShifts: { startsAt: string; endsAt: string; note: string | null }[];
  announcements: {
    id: string;
    title: string;
    body: string;
    type: string;
    publishedAt: string | null;
  }[];
  profile: {
    logoUrl: string | null;
    description: string | null;
    email: string | null;
    phoneExtra: string | null;
    prescriptionPickup: boolean;
    featured: boolean;
    photos: { url: string }[];
    services: { name: string; note: string | null }[];
  } | null;
}

export interface SearchParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  date?: string;
  openNow?: boolean;
  page?: number;
  perPage?: number;
}
