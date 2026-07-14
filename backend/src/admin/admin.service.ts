import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { RevalidationService } from './revalidation.service';
import { ModerateDto, ReviewClaimDto } from './dto/admin.dto';
import type { ClaimStatus, ModerationStatus } from '../generated/prisma/enums';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
    private readonly revalidation: RevalidationService,
  ) {}

  // --- Claimy ---
  listClaims(status?: string) {
    return this.prisma.pharmacyClaim.findMany({
      where: status ? { status: status as ClaimStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        pharmacy: { select: { name: true, slug: true, city: true } },
      },
    });
  }

  async reviewClaim(id: string, dto: ReviewClaimDto) {
    const claim = await this.prisma.pharmacyClaim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Zgłoszenie nie znalezione');

    if (dto.action === 'APPROVE') {
      // Zatwierdzenie: przypisz aptekę do użytkownika + oznacz claim.
      await this.prisma.$transaction([
        this.prisma.pharmacyClaim.update({
          where: { id },
          data: { status: 'APPROVED', reviewNote: dto.note ?? null },
        }),
        this.prisma.user.update({
          where: { id: claim.userId },
          data: { pharmacyId: claim.pharmacyId },
        }),
      ]);
      return { status: 'APPROVED' };
    }
    await this.prisma.pharmacyClaim.update({
      where: { id },
      data: { status: 'REJECTED', reviewNote: dto.note ?? null },
    });
    return { status: 'REJECTED' };
  }

  // --- Moderacja komunikatów ---
  listAnnouncements(status = 'PENDING') {
    return this.prisma.announcement.findMany({
      where: { status: status as ModerationStatus },
      orderBy: { createdAt: 'desc' },
      include: { pharmacy: { select: { name: true, slug: true } } },
    });
  }

  async moderateAnnouncement(id: string, dto: ModerateDto) {
    const ann = await this.prisma.announcement.findUnique({
      where: { id },
      include: { pharmacy: { select: { slug: true } } },
    });
    if (!ann) throw new NotFoundException('Komunikat nie znaleziony');

    if (dto.action === 'APPROVE') {
      await this.prisma.announcement.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          rejectionReason: null,
        },
      });
      await this.revalidation.revalidatePharmacy(ann.pharmacy.slug); // odśwież ISR karty
      return { status: 'PUBLISHED' };
    }
    await this.prisma.announcement.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: dto.reason ?? null },
    });
    return { status: 'REJECTED' };
  }

  // --- Moderacja zdjęć ---
  listPhotos(status = 'PENDING') {
    return this.prisma.photo.findMany({
      where: { status: status as ModerationStatus },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          include: { pharmacy: { select: { name: true, slug: true } } },
        },
      },
    });
  }

  async moderatePhoto(id: string, dto: ModerateDto) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: {
        profile: { include: { pharmacy: { select: { slug: true } } } },
      },
    });
    if (!photo) throw new NotFoundException('Zdjęcie nie znalezione');
    const newStatus: ModerationStatus =
      dto.action === 'APPROVE' ? 'PUBLISHED' : 'REJECTED';
    await this.prisma.photo.update({
      where: { id },
      data: { status: newStatus },
    });
    if (dto.action === 'APPROVE') {
      await this.revalidation.revalidatePharmacy(photo.profile.pharmacy.slug);
    }
    return { status: newStatus };
  }

  // --- Użytkownicy ---
  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        pharmacyId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async setUserActive(id: string, isActive: boolean) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
    if (!isActive) {
      // Dezaktywacja → unieważnij wszystkie refresh-tokeny.
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { id: user.id, isActive: user.isActive };
  }

  // --- Synchronizacja ---
  triggerSync(userId: string) {
    // Fire-and-forget — długi proces; wynik dostępny w liście SyncRun.
    void this.sync.run(`admin:${userId}`).catch(() => undefined);
    return { started: true };
  }

  listSyncRuns() {
    return this.prisma.syncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 30,
    });
  }

  // --- Statystyki ---
  async stats() {
    const [
      total,
      active,
      geocoded,
      pendingAnnouncements,
      pendingClaims,
      weekAnnouncements,
    ] = await Promise.all([
      this.prisma.pharmacy.count({ where: { removedFromRegistryAt: null } }),
      this.prisma.pharmacy.count({
        where: { removedFromRegistryAt: null, status: 'AKTYWNA' },
      }),
      this.prisma.$queryRaw<
        Array<{ n: number }>
      >`SELECT count(*)::int AS n FROM "Pharmacy" WHERE location IS NOT NULL AND "removedFromRegistryAt" IS NULL`,
      this.prisma.announcement.count({ where: { status: 'PENDING' } }),
      this.prisma.pharmacyClaim.count({ where: { status: 'PENDING' } }),
      this.prisma.announcement.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
        },
      }),
    ]);
    const geocodedCount = geocoded[0]?.n ?? 0;
    return {
      pharmacies: total,
      active,
      geocoded: geocodedCount,
      geocodingCoverage: active
        ? Math.round((geocodedCount / active) * 100)
        : 0,
      pendingAnnouncements,
      pendingClaims,
      announcementsLast7Days: weekAnnouncements,
    };
  }
}
