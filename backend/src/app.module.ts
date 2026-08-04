import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GeoModule } from './geo/geo.module';
import { PanelModule } from './panel/panel.module';
import { PharmaciesModule } from './pharmacies/pharmacies.module';
import { PrismaModule } from './prisma/prisma.module';
import { PromoModule } from './promo/promo.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    // Ładuje zmienne z pliku .env do process.env, globalnie dla całej aplikacji.
    ConfigModule.forRoot({ isGlobal: true }),
    // Harmonogram (cron nocnego synca rejestrowany w SyncService).
    ScheduleModule.forRoot(),
    // Serwowanie przetworzonych zdjęć (WebP) spod /uploads.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false, fallthrough: false },
    }),
    // Globalny rate limit: 100 żądań / 60 s / IP. Trasy auth zaostrzą to @Throttle w Fazie 4.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
    AuthModule,
    GeoModule,
    SyncModule,
    PharmaciesModule,
    PanelModule,
    AdminModule,
    PromoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard globalnie — chroni każdy endpoint przed floodem.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
