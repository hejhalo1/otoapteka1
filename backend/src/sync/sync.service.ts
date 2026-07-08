import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import type { PharmacyKind, PharmacyStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../geo/geocoding.service';
import { normalizeCityCase, uniquePharmacySlug } from '../common/slug.util';
import { buildWeekHours } from './hours-parser';
import { RawPharmacyRow } from './registry-columns';
import { RegistryClientService } from './registry-client.service';
import { RegistryParserService } from './registry-parser.service';

interface NormalizedPharmacy {
  registryId: string;
  name: string;
  kind: PharmacyKind;
  status: PharmacyStatus;
  statusRaw: string;
  ownerName: string | null;
  permitNumber: string | null;
  street: string;
  city: string;
  postalCode: string;
  voivodeship: string;
  county: string;
  commune: string;
  phone: string | null;
  website: string | null;
  registryHoursKey: string;
  hours: Array<{
    dayOfWeek: number;
    opensAt: number;
    closesAt: number;
    is24h: boolean;
  }>;
}

// Pola śledzone w diffie (zmiana → wpis w PharmacyChangeLog).
const TRACKED_FIELDS = [
  'name',
  'status',
  'statusRaw',
  'kind',
  'ownerName',
  'permitNumber',
  'street',
  'city',
  'postalCode',
  'voivodeship',
  'county',
  'commune',
  'phone',
  'website',
] as const;

interface ExistingPharmacy {
  id: string;
  registryId: string;
  name: string;
  status: string;
  statusRaw: string;
  kind: string;
  ownerName: string | null;
  permitNumber: string | null;
  street: string;
  city: string;
  postalCode: string;
  voivodeship: string;
  county: string;
  commune: string;
  phone: string | null;
  website: string | null;
  registryHoursKey: string | null;
  removedFromRegistryAt: Date | null;
  slug: string;
}

export interface SyncRunSummary {
  syncRunId: string;
  status: string;
  totalRows: number;
  added: number;
  updated: number;
  deactivated: number;
  geocoded: number;
  errors: number;
}

const CHUNK = 1000;

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly registryClient: RegistryClientService,
    private readonly parser: RegistryParserService,
    private readonly geocoding: GeocodingService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const expr = this.config.get<string>('SYNC_CRON') ?? '0 3 * * *';
    try {
      const job = CronJob.from({
        cronTime: expr,
        onTick: () => {
          this.run('cron').catch((e) =>
            this.logger.error(
              `Nocny sync nie powiódł się: ${(e as Error).message}`,
            ),
          );
        },
        timeZone: 'Europe/Warsaw',
        start: true,
      });
      this.scheduler.addCronJob('daily-registry-sync', job);
      this.logger.log(`Zarejestrowano nocny sync: "${expr}" (Europe/Warsaw).`);
    } catch (e) {
      this.logger.error(
        `Nie udało się zarejestrować crona "${expr}": ${(e as Error).message}`,
      );
    }
  }

  private mapKind(kindRaw: string): PharmacyKind {
    return kindRaw.toUpperCase() === 'PUNKT APTECZNY'
      ? 'PUNKT_APTECZNY'
      : 'OGOLNODOSTEPNA';
  }

  private mapStatus(statusRaw: string): PharmacyStatus {
    const s = statusRaw.toUpperCase().trim();
    if (s === 'AKTYWNA') return 'AKTYWNA';
    if (s.startsWith('NIEAKTYWNA - ZAWIESZENIE')) return 'ZAWIESZONA';
    if (s === 'NIEAKTYWNA') return 'NIEAKTYWNA';
    if (s.startsWith('CZASOWO')) return 'CZASOWO_NIECZYNNA';
    if (s.startsWith('OCZEKUJ')) return 'OCZEKUJACA';
    if (s.startsWith('UNIERUCHOMIONA')) return 'UNIERUCHOMIONA';
    return 'INNA';
  }

  private composeStreet(row: RawPharmacyRow): string {
    const st = [row.streetType, row.streetName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ');
    let bldg = row.buildingNo.trim();
    if (row.unitNo.trim())
      bldg = bldg ? `${bldg}/${row.unitNo.trim()}` : row.unitNo.trim();
    return [st, bldg].filter(Boolean).join(' ').trim();
  }

  private nn(v: string): string | null {
    const t = v.trim();
    return t === '' ? null : t;
  }

  private normalize(row: RawPharmacyRow): NormalizedPharmacy {
    const city = normalizeCityCase(row.city);
    const name =
      this.nn(row.name) ??
      this.nn(row.ownerName) ??
      `Apteka, ${city || 'Polska'}`;
    return {
      registryId: row.registryId.trim(),
      name,
      kind: this.mapKind(row.kindRaw),
      status: this.mapStatus(row.statusRaw),
      statusRaw: row.statusRaw.trim(),
      ownerName: this.nn(row.ownerName),
      permitNumber: this.nn(row.permitNumber),
      street: this.composeStreet(row),
      city,
      postalCode: row.postalCode.trim(),
      voivodeship: row.voivodeship.trim().toLowerCase(),
      county: normalizeCityCase(row.county),
      commune: normalizeCityCase(row.commune),
      phone: this.nn(row.phone),
      website: this.nn(row.website),
      registryHoursKey: [
        row.hours.mon,
        row.hours.tue,
        row.hours.wed,
        row.hours.thu,
        row.hours.fri,
        row.hours.sat,
        row.hours.sunTrade,
        row.hours.sunNoTrade,
      ].join('|'),
      hours: buildWeekHours(row.hours),
    };
  }

  async run(
    triggeredBy: string,
    opts?: { geocodeLimit?: number },
  ): Promise<SyncRunSummary> {
    if (this.running) {
      throw new ConflictException(
        'Synchronizacja już trwa — jedna naraz (mutex).',
      );
    }
    this.running = true;
    const errors: Array<Record<string, unknown>> = [];
    const syncRun = await this.prisma.syncRun.create({
      data: { status: 'RUNNING', triggeredBy },
    });
    this.logger.log(
      `SyncRun ${syncRun.id} start (triggeredBy=${triggeredBy}).`,
    );

    try {
      const resources = await this.registryClient.listResources();
      const resource = this.registryClient.pickFreshestResource(resources);
      const { buffer } = await this.registryClient.downloadFile(
        resource.fileUrl!,
      );
      const parsed = this.parser.parseBuffer(buffer);

      // Wczytaj istniejące apteki (klucz registryId) — do diffu, slugów i soft-delete.
      const existing = (await this.prisma.pharmacy.findMany({
        select: {
          id: true,
          registryId: true,
          name: true,
          status: true,
          statusRaw: true,
          kind: true,
          ownerName: true,
          permitNumber: true,
          street: true,
          city: true,
          postalCode: true,
          voivodeship: true,
          county: true,
          commune: true,
          phone: true,
          website: true,
          registryHoursKey: true,
          removedFromRegistryAt: true,
          slug: true,
        },
      })) as ExistingPharmacy[];
      const existingMap = new Map(existing.map((p) => [p.registryId, p]));
      const usedSlugs = new Set(existing.map((p) => p.slug));
      const seen = new Set<string>();

      const toInsert: NormalizedPharmacy[] = [];
      let updated = 0;

      for (const row of parsed.rows) {
        try {
          const norm = this.normalize(row);
          if (!norm.registryId) continue;
          seen.add(norm.registryId);
          const ex = existingMap.get(norm.registryId);
          if (!ex) {
            toInsert.push(norm);
          } else if (await this.updateExisting(ex, norm, syncRun.id)) {
            updated += 1;
          }
        } catch (e) {
          errors.push({
            rowNumber: row.rowNumber,
            registryId: row.registryId,
            error: (e as Error).message,
          });
        }
      }

      const added = await this.insertNew(toInsert, syncRun.id, usedSlugs);
      const deactivated = await this.softDeleteAbsent(
        existing,
        seen,
        syncRun.id,
      );

      const geocodeLimit =
        opts?.geocodeLimit ??
        Number(this.config.get<string>('GEOCODE_MAX_PER_RUN') ?? 500);
      const geo =
        geocodeLimit > 0
          ? await this.geocoding.geocodePending({ limit: geocodeLimit })
          : { attempted: 0, geocoded: 0, failed: 0 };

      const status = errors.length > 0 ? 'PARTIAL' : 'SUCCESS';
      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status,
          finishedAt: new Date(),
          resourceId: resource.id,
          resourceFormat: parsed.detectedFormat,
          dataDate: resource.dataDate,
          totalRows: parsed.totalDataRows,
          addedCount: added,
          updatedCount: updated,
          deactivatedCount: deactivated,
          geocodedCount: geo.geocoded,
          errorLog: errors.length
            ? (errors as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      const summary: SyncRunSummary = {
        syncRunId: syncRun.id,
        status,
        totalRows: parsed.totalDataRows,
        added,
        updated,
        deactivated,
        geocoded: geo.geocoded,
        errors: errors.length,
      };
      this.logger.log(
        `SyncRun ${syncRun.id} ${status}: ${JSON.stringify(summary)}`,
      );
      return summary;
    } catch (e) {
      const message = (e as Error).message;
      this.logger.error(`SyncRun ${syncRun.id} FAILED: ${message}`);
      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorLog: [...errors, { fatal: message }] as Prisma.InputJsonValue,
        },
      });
      throw e;
    } finally {
      this.running = false;
    }
  }

  private async updateExisting(
    ex: ExistingPharmacy,
    norm: NormalizedPharmacy,
    syncRunId: string,
  ): Promise<boolean> {
    const changes: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];
    for (const field of TRACKED_FIELDS) {
      const oldV = ex[field] ?? '';
      const newV = norm[field] ?? '';
      if (oldV !== newV) {
        changes.push({
          field,
          oldValue: ex[field] ?? null,
          newValue: norm[field] ?? null,
        });
      }
    }
    const addressChanged =
      ex.street !== norm.street ||
      ex.city !== norm.city ||
      ex.postalCode !== norm.postalCode;
    const hoursChanged = (ex.registryHoursKey ?? '') !== norm.registryHoursKey;
    const restored = ex.removedFromRegistryAt !== null;

    if (changes.length === 0 && !hoursChanged && !restored) return false;

    await this.prisma.$transaction(async (tx) => {
      await tx.pharmacy.update({
        where: { id: ex.id },
        data: {
          name: norm.name,
          status: norm.status,
          statusRaw: norm.statusRaw,
          kind: norm.kind,
          ownerName: norm.ownerName,
          permitNumber: norm.permitNumber,
          street: norm.street,
          city: norm.city,
          postalCode: norm.postalCode,
          voivodeship: norm.voivodeship,
          county: norm.county,
          commune: norm.commune,
          phone: norm.phone,
          website: norm.website,
          registryHoursKey: norm.registryHoursKey,
          ...(restored ? { removedFromRegistryAt: null } : {}),
          ...(addressChanged
            ? { lat: null, lng: null, geocodedAt: null, geocodeFailed: false }
            : {}),
        },
      });

      if (addressChanged) {
        // location to kolumna PostGIS (Unsupported) — reset przez raw.
        await tx.$executeRaw`UPDATE "Pharmacy" SET location = NULL WHERE id = ${ex.id}`;
      }

      if (hoursChanged) {
        await tx.openingHours.deleteMany({
          where: { pharmacyId: ex.id, source: 'REGISTRY' },
        });
        if (norm.hours.length > 0) {
          await tx.openingHours.createMany({
            data: norm.hours.map((h) => ({
              pharmacyId: ex.id,
              dayOfWeek: h.dayOfWeek,
              opensAt: h.opensAt,
              closesAt: h.closesAt,
              is24h: h.is24h,
              source: 'REGISTRY' as const,
            })),
          });
        }
      }

      const logEntries = [...changes];
      if (restored)
        logEntries.push({
          field: '__restored__',
          oldValue: 'removed',
          newValue: 'active',
        });
      if (logEntries.length > 0) {
        await tx.pharmacyChangeLog.createMany({
          data: logEntries.map((c) => ({
            syncRunId,
            pharmacyId: ex.id,
            field: c.field,
            oldValue: c.oldValue,
            newValue: c.newValue,
          })),
        });
      }
    });
    return true;
  }

  private async insertNew(
    list: NormalizedPharmacy[],
    syncRunId: string,
    usedSlugs: Set<string>,
  ): Promise<number> {
    if (list.length === 0) return 0;

    const pharmacies: Prisma.PharmacyCreateManyInput[] = [];
    const hours: Prisma.OpeningHoursCreateManyInput[] = [];
    const changelog: Prisma.PharmacyChangeLogCreateManyInput[] = [];

    for (const norm of list) {
      const id = randomUUID();
      const slug = uniquePharmacySlug(norm.name, norm.city, usedSlugs);
      pharmacies.push({
        id,
        registryId: norm.registryId,
        permitNumber: norm.permitNumber,
        name: norm.name,
        kind: norm.kind,
        status: norm.status,
        statusRaw: norm.statusRaw,
        ownerName: norm.ownerName,
        street: norm.street,
        city: norm.city,
        postalCode: norm.postalCode,
        voivodeship: norm.voivodeship,
        county: norm.county,
        commune: norm.commune,
        phone: norm.phone,
        website: norm.website,
        slug,
        registryHoursKey: norm.registryHoursKey,
      });
      for (const h of norm.hours) {
        hours.push({
          pharmacyId: id,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          is24h: h.is24h,
          source: 'REGISTRY',
        });
      }
      changelog.push({
        syncRunId,
        pharmacyId: id,
        field: '__created__',
        oldValue: null,
        newValue: norm.name,
      });
    }

    for (let i = 0; i < pharmacies.length; i += CHUNK) {
      await this.prisma.pharmacy.createMany({
        data: pharmacies.slice(i, i + CHUNK),
      });
    }
    for (let i = 0; i < hours.length; i += CHUNK) {
      await this.prisma.openingHours.createMany({
        data: hours.slice(i, i + CHUNK),
      });
    }
    for (let i = 0; i < changelog.length; i += CHUNK) {
      await this.prisma.pharmacyChangeLog.createMany({
        data: changelog.slice(i, i + CHUNK),
      });
    }
    this.logger.log(
      `Dodano ${pharmacies.length} nowych aptek, ${hours.length} wpisów godzin.`,
    );
    return pharmacies.length;
  }

  private async softDeleteAbsent(
    existing: ExistingPharmacy[],
    seen: Set<string>,
    syncRunId: string,
  ): Promise<number> {
    const absentIds = existing
      .filter(
        (p) => !seen.has(p.registryId) && p.removedFromRegistryAt === null,
      )
      .map((p) => p.id);
    if (absentIds.length === 0) return 0;

    const now = new Date();
    for (let i = 0; i < absentIds.length; i += CHUNK) {
      const chunk = absentIds.slice(i, i + CHUNK);
      await this.prisma.pharmacy.updateMany({
        where: { id: { in: chunk } },
        data: { removedFromRegistryAt: now },
      });
      await this.prisma.pharmacyChangeLog.createMany({
        data: chunk.map((id) => ({
          syncRunId,
          pharmacyId: id,
          field: '__removed__',
          oldValue: 'active',
          newValue: 'removed',
        })),
      });
    }
    this.logger.log(
      `Soft-delete: ${absentIds.length} aptek nieobecnych w pliku.`,
    );
    return absentIds.length;
  }
}
