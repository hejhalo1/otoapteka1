import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImageService } from '../panel/image.service';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { PromoAdminController } from './promo-admin.controller';

// Galeria promocyjna strony głównej: publiczny odczyt + zarządzanie z panelu admina.
@Module({
  imports: [AuthModule],
  controllers: [PromoController, PromoAdminController],
  providers: [PromoService, ImageService],
})
export class PromoModule {}
