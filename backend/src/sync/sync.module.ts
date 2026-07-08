import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { RegistryClientService } from './registry-client.service';
import { RegistryParserService } from './registry-parser.service';
import { SyncService } from './sync.service';

// Synchronizacja z Rejestrem Aptek (dane.gov.pl). Cron rejestrowany w SyncService.onModuleInit.
// Wymaga ScheduleModule.forRoot() (podpięte w AppModule).
@Module({
  imports: [GeoModule],
  providers: [RegistryClientService, RegistryParserService, SyncService],
  exports: [SyncService],
})
export class SyncModule {}
