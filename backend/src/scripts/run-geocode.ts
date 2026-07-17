import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { GeocodingService } from '../geo/geocoding.service';

// Ręczne geokodowanie zaległych aptek (GUGiK, zapasowo Nominatim). Użycie:
//   npm run geocode -- --limit=60 --city=Warszawa
//   npm run geocode -- --limit=20000 --retry-failed   (ponawia wcześniejsze porażki)
function argValue(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const limit = Number(argValue('limit') ?? 100);
  const city = argValue('city');
  const retryFailed = hasFlag('retry-failed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const geocoding = app.get(GeocodingService);
    const result = await geocoding.geocodePending({ limit, city, retryFailed });
    Logger.log(`Geokodowanie: ${JSON.stringify(result)}`, 'run-geocode');
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    Logger.error(e instanceof Error ? e.stack : String(e), 'run-geocode');
    process.exit(1);
  });
