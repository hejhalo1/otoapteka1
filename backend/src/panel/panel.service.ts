import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAnnouncementDto,
  CreateDutyDto,
  SetHoursDto,
  SetServicesDto,
  UpdateProfileDto,
} from './dto/panel.dto';
import type { AnnouncementType } from '../generated/prisma/enums';

function hhmmToMin(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

@Injectable()
export class PanelService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyPharmacy(pharmacyId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: {
        profile: {
          include: { services: { include: { service: true } }, photos: true },
        },
        openingHours: { orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }] },
        dutyShifts: { orderBy: { startsAt: 'asc' } },
        announcements: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!pharmacy) throw new NotFoundException('Apteka nie znaleziona');
    return pharmacy;
  }

  private async ensureProfile(pharmacyId: string) {
    return this.prisma.pharmacyProfile.upsert({
      where: { pharmacyId },
      create: { pharmacyId },
      update: {},
    });
  }

  async updateProfile(pharmacyId: string, dto: UpdateProfileDto) {
    return this.prisma.pharmacyProfile.upsert({
      where: { pharmacyId },
      create: { pharmacyId, ...dto },
      update: { ...dto },
    });
  }

  async setLogo(pharmacyId: string, logoUrl: string) {
    await this.prisma.pharmacyProfile.upsert({
      where: { pharmacyId },
      create: { pharmacyId, logoUrl },
      update: { logoUrl },
    });
    return { logoUrl };
  }

  // Godziny apteki — tylko gdy rejestr ich NIE dostarcza (dane urzędowe nietykalne).
  async setHours(pharmacyId: string, dto: SetHoursDto) {
    const registryCount = await this.prisma.openingHours.count({
      where: { pharmacyId, source: 'REGISTRY' },
    });
    if (registryCount > 0) {
      throw new BadRequestException(
        'Godziny pochodzą z rejestru i nie można ich nadpisać.',
      );
    }
    const data = dto.hours.map((h) => {
      const is24h = h.is24h ?? false;
      return {
        pharmacyId,
        dayOfWeek: h.dayOfWeek,
        opensAt: is24h ? 0 : hhmmToMin(h.opens),
        closesAt: is24h ? 1440 : hhmmToMin(h.closes),
        is24h,
        source: 'PHARMACY' as const,
      };
    });
    await this.prisma.$transaction([
      this.prisma.openingHours.deleteMany({
        where: { pharmacyId, source: 'PHARMACY' },
      }),
      this.prisma.openingHours.createMany({ data }),
    ]);
    return { count: data.length };
  }

  async createAnnouncement(pharmacyId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        pharmacyId,
        title: dto.title,
        body: dto.body,
        type: dto.type as AnnouncementType,
        status: 'PENDING', // moderacja przed publikacją
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async deleteAnnouncement(pharmacyId: string, id: string) {
    // Ownership: usuwamy tylko własne (where zawiera pharmacyId z JWT).
    const res = await this.prisma.announcement.deleteMany({
      where: { id, pharmacyId },
    });
    if (res.count === 0)
      throw new NotFoundException('Komunikat nie znaleziony');
    return { deleted: true };
  }

  async createDuty(pharmacyId: string, dto: CreateDutyDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt)
      throw new BadRequestException('Koniec dyżuru musi być po początku');
    return this.prisma.dutyShift.create({
      data: { pharmacyId, startsAt, endsAt, note: dto.note ?? null },
    });
  }

  async deleteDuty(pharmacyId: string, id: string) {
    const res = await this.prisma.dutyShift.deleteMany({
      where: { id, pharmacyId },
    });
    if (res.count === 0) throw new NotFoundException('Dyżur nie znaleziony');
    return { deleted: true };
  }

  getServiceCatalog() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  async setServices(pharmacyId: string, dto: SetServicesDto) {
    await this.ensureProfile(pharmacyId);
    const ids = dto.services.map((s) => s.serviceId);
    const valid = await this.prisma.service.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const validIds = new Set(valid.map((v) => v.id));
    const data = dto.services
      .filter((s) => validIds.has(s.serviceId))
      .map((s) => ({
        profileId: pharmacyId,
        serviceId: s.serviceId,
        note: s.note ?? null,
      }));
    await this.prisma.$transaction([
      this.prisma.pharmacyService.deleteMany({
        where: { profileId: pharmacyId },
      }),
      ...(data.length
        ? [this.prisma.pharmacyService.createMany({ data })]
        : []),
    ]);
    return { count: data.length };
  }

  async addPhoto(pharmacyId: string, url: string) {
    await this.ensureProfile(pharmacyId);
    return this.prisma.photo.create({
      data: { profileId: pharmacyId, url, status: 'PENDING' },
    });
  }

  async deletePhoto(pharmacyId: string, id: string) {
    const res = await this.prisma.photo.deleteMany({
      where: { id, profileId: pharmacyId },
    });
    if (res.count === 0) throw new NotFoundException('Zdjęcie nie znalezione');
    return { deleted: true };
  }
}
