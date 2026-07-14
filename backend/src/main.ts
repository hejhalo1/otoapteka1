import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Wszystkie trasy pod prefiksem /api.
  app.setGlobalPrefix('api');

  // Nagłówki bezpieczeństwa (CSP frontendu jest po stronie Next.js — patrz next.config).
  app.use(helmet());
  app.use(cookieParser());

  // CORS zawężony do origin z env (nie enableCors() bez argumentów).
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true, // refresh token w cookie httpOnly
  });

  // Globalna walidacja: odrzuca nieznane pola, przycina do DTO, konwertuje typy.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Spójny format błędów + request-id w logach.
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`otoapteka backend: http://localhost:${port}/api`, 'Bootstrap');
}
void bootstrap();
