import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SyncService } from '../sync/sync.service';

// Ręczne uruchomienie synchronizacji (poza cronem). Użycie:
//   npm run sync            — pełny sync + geokodowanie wg GEOCODE_MAX_PER_RUN
//   npm run sync -- --no-geocode   — sam import, bez geokodowania
async function main() {
  const noGeocode = process.argv.includes('--no-geocode');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const sync = app.get(SyncService);
    const summary = await sync.run(
      'manual-script',
      noGeocode ? { geocodeLimit: 0 } : undefined,
    );
    Logger.log(`Zakończono: ${JSON.stringify(summary)}`, 'run-sync');
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    Logger.error(e instanceof Error ? e.stack : String(e), 'run-sync');
    process.exit(1);
  });
