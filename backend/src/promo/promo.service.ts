import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoSlideDto, UpdatePromoSlideDto } from './dto/promo.dto';

@Injectable()
export class PromoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Publiczne: aktywne slajdy w kolejności (galeria strony głównej). */
  listActive() {
    return this.prisma.promoSlide.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        imageUrl: true,
        title: true,
        subtitle: true,
        href: true,
      },
    });
  }

  /** Admin: wszystkie slajdy. */
  listAll() {
    return this.prisma.promoSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(imageUrl: string, dto: CreatePromoSlideDto) {
    const max = await this.prisma.promoSlide.aggregate({
      _max: { sortOrder: true },
    });
    return this.prisma.promoSlide.create({
      data: {
        imageUrl,
        title: dto.title ?? null,
        subtitle: dto.subtitle ?? null,
        href: dto.href ?? null,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(id: string, dto: UpdatePromoSlideDto) {
    await this.ensureExists(id);
    return this.prisma.promoSlide.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title || null } : {}),
        ...(dto.subtitle !== undefined
          ? { subtitle: dto.subtitle || null }
          : {}),
        ...(dto.href !== undefined ? { href: dto.href || null } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.promoSlide.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureExists(id: string) {
    const slide = await this.prisma.promoSlide.findUnique({ where: { id } });
    if (!slide) throw new NotFoundException('Slajd nie znaleziony');
  }
}
