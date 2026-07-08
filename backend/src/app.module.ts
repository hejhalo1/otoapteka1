import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Ładuje zmienne z pliku .env do process.env, globalnie dla całej aplikacji.
    ConfigModule.forRoot({ isGlobal: true }),
    // Globalny rate limit: 100 żądań / 60 s / IP. Trasy auth zaostrzą to @Throttle w Fazie 4.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard globalnie — chroni każdy endpoint przed floodem.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
