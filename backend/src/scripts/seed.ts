import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

// Seed pierwszego administratora — idempotentny (upsert po e-mailu).
// Czyta ADMIN_EMAIL i ADMIN_PASSWORD z env. Uruchom: npm run db:seed
async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Ustaw ADMIN_EMAIL i ADMIN_PASSWORD w .env');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const prisma = app.get(PrismaService);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      Logger.log(`Administrator ${email} już istnieje — pomijam.`, 'seed');
    } else {
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      await prisma.user.create({
        data: { email, passwordHash, role: 'ADMIN' },
      });
      Logger.log(`Utworzono administratora: ${email}`, 'seed');
    }

    // Słownik usług (idempotentny upsert po slug).
    const services = [
      { slug: 'szczepienia', name: 'Szczepienia' },
      { slug: 'pomiar-cisnienia', name: 'Pomiar ciśnienia' },
      { slug: 'pomiar-glukozy', name: 'Pomiar glukozy' },
      { slug: 'przeglad-lekowy', name: 'Przegląd lekowy' },
      {
        slug: 'konsultacja-farmaceutyczna',
        name: 'Konsultacja farmaceutyczna',
      },
      { slug: 'opatrunki', name: 'Zmiana opatrunków' },
    ];
    for (const s of services) {
      await prisma.service.upsert({
        where: { slug: s.slug },
        create: s,
        update: { name: s.name },
      });
    }
    Logger.log(`Zseedowano słownik usług (${services.length}).`, 'seed');
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    Logger.error(e instanceof Error ? e.message : String(e), 'seed');
    process.exit(1);
  });
