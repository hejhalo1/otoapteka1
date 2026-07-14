import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SyncModule } from '../sync/sync.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RevalidationService } from './revalidation.service';

// Panel admina (rola ADMIN): moderacja, claimy, użytkownicy, sync, statystyki, rewalidacja.
@Module({
  imports: [AuthModule, SyncModule],
  controllers: [AdminController],
  providers: [AdminService, RevalidationService],
})
export class AdminModule {}
