import { Injectable, NotFoundException } from '@nestjs/common';
import { TZDate } from '@date-fns/tz';
import { PrismaService } from '../prisma/prisma.service';
import { RoutingService } from '../geo/routing.service';
import {
  computeOpenStatus,
  DutyInterval,
  HoursSegment,
  OpenStatus,
  selectEffectiveHours,
  TIMEZONE,
} from './open-status';
import { FindPharmaciesDto } from './dto/find-pharmacies.dto';

interface SearchRow {
  id: string;
  slug: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  voivodeship: string;
  phone: string | null;
  kind: string;
  status: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  totalCount: number;
}

export interface DayHours {
  dayOfWeek: number;
  opens: string; // "HH:MM"
  closes: string;
  is24h: boolean;
}

export interface PharmacyCard {
  id: string;
  slug: string;
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    voivodeship: string;
  };
  phone: string | null;
  distanceMeters: number;
  walkMinutes: number;
  driveMinutes: number;
  openStatus: OpenStatus;
  hoursForDate: DayHours[];
  latestAnnouncement: {
    title: string;
    type: string;
    publishedAt: string | null;
  } | null;
}

export interface PharmacyListResponse {
  data: PharmacyCard[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
  meta: { referenceTime: string; date: string };
}

const MAX_OPENNOW_CANDIDATES = 200;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function minutesToHHMM(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

@Injectable()
export class PharmaciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routing: RoutingService,
  ) {}

  private resolveReferenceTime(date?: string, openAt?: string): Date {
    const now = new TZDate(Date.now(), TIMEZONE);
    let [y, mo, d] = [now.getFullYear(), now.getMonth(), now.getDate()];
    if (date) {
      const [Y, M, D] = date.split('-').map(Number);
      [y, mo, d] = [Y, M - 1, D];
    }
    let [hh, mm] = [now.getHours(), now.getMinutes()];
    if (openAt) {
      const [H, Mi] = openAt.split(':').map(Number);
      [hh, mm] = [H, Mi];
    }
    return new Date(new TZDate(y, mo, d, hh, mm, 0, TIMEZONE).getTime());
  }

  private dayOfWeek(instant: Date): number {
    return (new TZDate(instant.getTime(), TIMEZONE).getDay() + 6) % 7;
  }

  private toSegments(
    rows: Array<{
      dayOfWeek: number;
      opensAt: number;
      closesAt: number;
      is24h: boolean;
      source: string;
    }>,
  ): HoursSegment[] {
    return selectEffectiveHours(rows).map((r) => ({
      dayOfWeek: r.dayOfWeek,
      opensAt: r.opensAt,
      closesAt: r.closesAt,
      is24h: r.is24h,
    }));
  }

  private hoursForDay(segments: HoursSegment[], dayOfWeek: number): DayHours[] {
    return segments
      .filter((s) => s.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.opensAt - b.opensAt)
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        opens: minutesToHHMM(s.opensAt),
        closes: s.closesAt === 1440 ? '24:00' : minutesToHHMM(s.closesAt),
        is24h: s.is24h,
      }));
  }

  async findNearby(dto: FindPharmaciesDto): Promise<PharmacyListResponse> {
    const referenceTime = this.resolveReferenceTime(dto.date, dto.openAt);
    const refDow = this.dayOfWeek(referenceTime);
    const radiusMeters = dto.radiusKm * 1000;
    const { lat, lng } = dto;

    // Przy filtrze openNow bierzemy większy zbiór kandydatów i filtrujemy/paginujemy w pamięci
    // (status otwarcia liczy się w strefie czasowej, nie w SQL).
    const fetchLimit = dto.openNow ? MAX_OPENNOW_CANDIDATES : dto.perPage;
    const fetchOffset = dto.openNow ? 0 : (dto.page - 1) * dto.perPage;

    // count(*) OVER() daje total w tym samym skanie (bez drugiego zapytania COUNT).
    const rows = await this.prisma.$queryRaw<SearchRow[]>`
      SELECT id, slug, name, street, city, "postalCode", voivodeship, phone,
             kind::text AS kind, status::text AS status, lat, lng,
             ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS "distanceMeters",
             count(*) OVER()::int AS "totalCount"
      FROM "Pharmacy"
      WHERE "removedFromRegistryAt" IS NULL
        AND location IS NOT NULL
        AND status = 'AKTYWNA'
        AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
      ORDER BY "distanceMeters" ASC
      LIMIT ${fetchLimit} OFFSET ${fetchOffset}`;

    const ids = rows.map((r) => r.id);
    const [hoursByPharmacy, dutiesByPharmacy, announcementByPharmacy] =
      await this.loadCardExtras(ids, referenceTime);

    // Zbuduj karty (przed ewentualnym filtrem openNow i paginacją).
    let cards: PharmacyCard[] = rows.map((r) => {
      const segments = this.toSegments(hoursByPharmacy.get(r.id) ?? []);
      const duties = dutiesByPharmacy.get(r.id) ?? [];
      const openStatus = computeOpenStatus(segments, duties, referenceTime);
      const ann = announcementByPharmacy.get(r.id) ?? null;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        address: {
          street: r.street,
          city: r.city,
          postalCode: r.postalCode,
          voivodeship: r.voivodeship,
        },
        phone: r.phone,
        distanceMeters: Math.round(r.distanceMeters),
        walkMinutes: 0,
        driveMinutes: 0,
        openStatus,
        hoursForDate: this.hoursForDay(segments, refDow),
        latestAnnouncement: ann,
      };
    });

    let total: number;
    if (dto.openNow) {
      cards = cards.filter(
        (c) =>
          c.openStatus.state === 'OPEN' ||
          c.openStatus.state === 'CLOSING_SOON',
      );
      total = cards.length; // przybliżenie w granicach MAX_OPENNOW_CANDIDATES
      const start = (dto.page - 1) * dto.perPage;
      cards = cards.slice(start, start + dto.perPage);
    } else {
      total = rows[0]?.totalCount ?? 0; // z count(*) OVER() — bez osobnego zapytania
    }

    // Czasy tras liczymy tylko dla aptek na tej stronie.
    const travel = await this.routing.getTravelTimes(
      { lat, lng },
      cards.map((c) => ({
        lat: rows.find((r) => r.id === c.id)!.lat,
        lng: rows.find((r) => r.id === c.id)!.lng,
        distanceMeters: c.distanceMeters,
      })),
    );
    cards.forEach((c, i) => {
      c.walkMinutes = travel[i].walkMinutes;
      c.driveMinutes = travel[i].driveMinutes;
    });

    return {
      data: cards,
      pagination: {
        page: dto.page,
        perPage: dto.perPage,
        total,
        hasMore: dto.openNow
          ? dto.page * dto.perPage < total
          : (dto.page - 1) * dto.perPage + cards.length < total,
      },
      meta: {
        referenceTime: referenceTime.toISOString(),
        date: dto.date ?? this.isoDate(referenceTime),
      },
    };
  }

  private isoDate(instant: Date): string {
    const z = new TZDate(instant.getTime(), TIMEZONE);
    return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
  }

  private async loadCardExtras(ids: string[], referenceTime: Date) {
    const hoursByPharmacy = new Map<
      string,
      Array<{
        dayOfWeek: number;
        opensAt: number;
        closesAt: number;
        is24h: boolean;
        source: string;
      }>
    >();
    const dutiesByPharmacy = new Map<string, DutyInterval[]>();
    const announcementByPharmacy = new Map<
      string,
      { title: string; type: string; publishedAt: string | null }
    >();
    if (ids.length === 0)
      return [
        hoursByPharmacy,
        dutiesByPharmacy,
        announcementByPharmacy,
      ] as const;

    const windowStart = new Date(referenceTime.getTime() - 86_400_000);
    const windowEnd = new Date(referenceTime.getTime() + 7 * 86_400_000);
    const now = new Date();

    const [hours, duties, announcements] = await Promise.all([
      this.prisma.openingHours.findMany({
        where: { pharmacyId: { in: ids } },
        select: {
          pharmacyId: true,
          dayOfWeek: true,
          opensAt: true,
          closesAt: true,
          is24h: true,
          source: true,
        },
      }),
      this.prisma.dutyShift.findMany({
        where: {
          pharmacyId: { in: ids },
          endsAt: { gte: windowStart },
          startsAt: { lte: windowEnd },
        },
        select: { pharmacyId: true, startsAt: true, endsAt: true },
      }),
      this.prisma.announcement.findMany({
        where: {
          pharmacyId: { in: ids },
          status: 'PUBLISHED',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { publishedAt: 'desc' },
        select: {
          pharmacyId: true,
          title: true,
          type: true,
          publishedAt: true,
        },
      }),
    ]);

    for (const h of hours) {
      const arr = hoursByPharmacy.get(h.pharmacyId) ?? [];
      arr.push(h);
      hoursByPharmacy.set(h.pharmacyId, arr);
    }
    for (const d of duties) {
      const arr = dutiesByPharmacy.get(d.pharmacyId) ?? [];
      arr.push({ startsAt: d.startsAt, endsAt: d.endsAt });
      dutiesByPharmacy.set(d.pharmacyId, arr);
    }
    for (const a of announcements) {
      if (!announcementByPharmacy.has(a.pharmacyId)) {
        announcementByPharmacy.set(a.pharmacyId, {
          title: a.title,
          type: a.type,
          publishedAt: a.publishedAt?.toISOString() ?? null,
        });
      }
    }
    return [hoursByPharmacy, dutiesByPharmacy, announcementByPharmacy] as const;
  }

  async findBySlug(slug: string, date?: string) {
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { slug, removedFromRegistryAt: null },
      include: {
        profile: {
          include: {
            services: { include: { service: true } },
            photos: {
              where: { status: 'PUBLISHED' },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        openingHours: true,
        dutyShifts: {
          where: { endsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
        },
        announcements: {
          where: {
            status: 'PUBLISHED',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { publishedAt: 'desc' },
        },
      },
    });
    if (!pharmacy) throw new NotFoundException('Apteka nie znaleziona');

    const referenceTime = this.resolveReferenceTime(date);
    const segments = this.toSegments(pharmacy.openingHours);
    const duties: DutyInterval[] = pharmacy.dutyShifts.map((d) => ({
      startsAt: d.startsAt,
      endsAt: d.endsAt,
    }));
    const openStatus = computeOpenStatus(segments, duties, referenceTime);

    // Godziny całego tygodnia (0..6).
    const weekHours = Array.from({ length: 7 }, (_, dow) => ({
      dayOfWeek: dow,
      segments: this.hoursForDay(segments, dow),
    }));

    return {
      id: pharmacy.id,
      slug: pharmacy.slug,
      name: pharmacy.name,
      kind: pharmacy.kind,
      status: pharmacy.status,
      address: {
        street: pharmacy.street,
        city: pharmacy.city,
        postalCode: pharmacy.postalCode,
        voivodeship: pharmacy.voivodeship,
        county: pharmacy.county,
        commune: pharmacy.commune,
      },
      phone: pharmacy.phone,
      website: pharmacy.website,
      lat: pharmacy.lat,
      lng: pharmacy.lng,
      openStatus,
      weekHours,
      dutyShifts: pharmacy.dutyShifts.map((d) => ({
        startsAt: d.startsAt.toISOString(),
        endsAt: d.endsAt.toISOString(),
        note: d.note,
      })),
      announcements: pharmacy.announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        publishedAt: a.publishedAt?.toISOString() ?? null,
      })),
      profile: pharmacy.profile
        ? {
            logoUrl: pharmacy.profile.logoUrl,
            description: pharmacy.profile.description,
            email: pharmacy.profile.email,
            phoneExtra: pharmacy.profile.phoneExtra,
            prescriptionPickup: pharmacy.profile.prescriptionPickup,
            featured: pharmacy.profile.featured,
            photos: pharmacy.profile.photos.map((p) => ({ url: p.url })),
            services: pharmacy.profile.services.map((s) => ({
              name: s.service.name,
              note: s.note,
            })),
          }
        : null,
    };
  }

  async getAllSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
    const rows = await this.prisma.pharmacy.findMany({
      where: { removedFromRegistryAt: null, status: 'AKTYWNA' },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    });
    return rows.map((r) => ({
      slug: r.slug,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
}
