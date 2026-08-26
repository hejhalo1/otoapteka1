import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SyncModule } from '../sync/sync.module';
import { PanelModule } from '../panel/panel.module';
import { AdminController } from './admin.controller';
import { AdminPharmaciesController } from './admin-pharmacies.controller';
import { AdminService } from './admin.service';
import { AdminPharmacyService } from './admin-pharmacy.service';
import { RevalidationService } from './revalidation.service';

// Panel admina (rola ADMIN): moderacja, claimy, użytkownicy, sync, statystyki,
// rewalidacja oraz zarządzanie panelem dowolnej apteki (AdminPharmacies*).
@Module({
  imports: [AuthModule, SyncModule, PanelModule],
  controllers: [AdminController, AdminPharmaciesController],
  providers: [AdminService, AdminPharmacyService, RevalidationService],
})
export class AdminModule {}
