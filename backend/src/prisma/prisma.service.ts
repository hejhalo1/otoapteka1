import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// PrismaService = klient Prisma opakowany w serwis NestJS, żeby można go było
// wstrzykiwać (dependency injection) i żeby otwierał/zamykał połączenie razem z aplikacją.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 używa driver adaptera zamiast wbudowanego silnika.
    // connectionString czytamy z DATABASE_URL (ładowane z .env przez ConfigModule).
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
