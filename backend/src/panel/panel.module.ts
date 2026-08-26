import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';
import { ImageService } from './image.service';

// Panel apteki (rola PHARMACY_MANAGER). Guardy z AuthModule.
@Module({
  imports: [AuthModule],
  controllers: [PanelController],
  providers: [PanelService, ImageService],
  exports: [PanelService],
})
export class PanelModule {}
