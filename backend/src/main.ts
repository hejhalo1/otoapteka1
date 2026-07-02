import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Pozwala frontendowi (Next.js na innym porcie) wołać ten backend.
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
