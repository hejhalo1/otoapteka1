import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Serwis = logika biznesowa. Tu rozmawiamy z bazą przez wstrzyknięty PrismaService.
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // SELECT * FROM "Product" ORDER BY id
  findAll() {
    return this.prisma.product.findMany({ orderBy: { id: 'asc' } });
  }

  // INSERT INTO "Product" (...) VALUES (...)
  create(data: { name: string; price: number }) {
    return this.prisma.product.create({ data });
  }
}
