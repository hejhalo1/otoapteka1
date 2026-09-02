import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PanelService } from '../panel/panel.service';
import { RevalidationService } from './revalidation.service';
import {
  CreateAnnouncementDto,
  CreateDutyDto,
  UpdateProfileDto,
} from '../panel/dto/panel.dto';
import type { AnnouncementType } from '../generated/prisma/enums';

// Admin zarządza panelem DOWOLNEJ apteki. Deleguje do PanelService (te same
// operacje co apteka na swoich danych), po zmianie rewaliduje ISR karty.
@Injectable()
export class AdminPharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly panel: PanelService,
    private readonly revalidation: RevalidationService,
  ) {}

  // Wyszukiwarka aptek do wyboru (po nazwie/mieście/ulicy).
  async search(q?: string, voivodeship?: string, city?: string) {
    const query = (q ?? '').trim();
    const woj = (voivodeship ?? '').trim();
    const cityName = (city ?? '').trim();
    return this.prisma.pharmacy.findMany({
      where: {
        removedFromRegistryAt: null,
        ...(woj ? { voivodeship: { equals: woj, mode: 'insensitive' } } : {}),
        ...(cityName ? { city: { equals: cityName, mode: 'insensitive' } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { street: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ voivodeship: 'asc' }, { city: 'asc' }, { name: 'asc' }],
      // Wyszukiwanie: krótka lista. Wybór miasta: pełna lista aptek tego miasta.
      take: cityName ? 300 : 50,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        street: true,
        voivodeship: true,
      },
    });
  }

  // Pełne dane panelu wybranej apteki (ten sam kształt co panel apteki).
  getPanel(pid: string) {
    return this.panel.getMyPharmacy(pid);
  }

  private async revalidate(pid: string): Promise<void> {
    const p = await this.prisma.pharmacy.findUnique({
      where: { id: pid },
      select: { slug: true },
    });
    if (p?.slug) await this.revalidation.revalidatePharmacy(p.slug);
  }

  async updateProfile(pid: string, dto: UpdateProfileDto) {
    const res = await this.panel.updateProfile(pid, dto);
    await this.revalidate(pid);
    return res;
  }

  // Admin jest moderatorem — publikuje komunikat od razu (pomija kolejkę PENDING).
  async createAnnouncement(pid: string, dto: CreateAnnouncementDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pid },
      select: { slug: true },
    });
    if (!pharmacy) throw new NotFoundException('Apteka nie znaleziona');
    const created = await this.prisma.announcement.create({
      data: {
        pharmacyId: pid,
        title: dto.title,
        body: dto.body,
        type: dto.type as AnnouncementType,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    await this.revalidation.revalidatePharmacy(pharmacy.slug);
    return created;
  }

  async deleteAnnouncement(pid: string, id: string) {
    const res = await this.panel.deleteAnnouncement(pid, id);
    await this.revalidate(pid);
    return res;
  }

  async createDuty(pid: string, dto: CreateDutyDto) {
    const res = await this.panel.createDuty(pid, dto);
    await this.revalidate(pid);
    return res;
  }

  async deleteDuty(pid: string, id: string) {
    const res = await this.panel.deleteDuty(pid, id);
    await this.revalidate(pid);
    return res;
  }
}
