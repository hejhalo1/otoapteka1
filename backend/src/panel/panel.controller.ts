import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePharmacyGuard } from '../auth/guards/require-pharmacy.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/auth.types';
import { PanelService } from './panel.service';
import { ImageService, MAX_UPLOAD_BYTES } from './image.service';
import {
  CreateAnnouncementDto,
  CreateDutyDto,
  SetHoursDto,
  SetServicesDto,
  UpdateProfileDto,
} from './dto/panel.dto';

interface UploadedImage {
  buffer: Buffer;
  size: number;
}

// Panel apteki — pisze WYŁĄCZNIE w danych dodatkowych, zawsze na user.pharmacyId (IDOR-proof).
@UseGuards(JwtAuthGuard, RolesGuard, RequirePharmacyGuard)
@Roles('PHARMACY_MANAGER')
@Controller('panel')
export class PanelController {
  constructor(
    private readonly panel: PanelService,
    private readonly images: ImageService,
  ) {}

  private pid(user: JwtUser): string {
    return user.pharmacyId as string; // RequirePharmacyGuard gwarantuje niepuste
  }

  @Get('pharmacy')
  getPharmacy(@CurrentUser() user: JwtUser) {
    return this.panel.getMyPharmacy(this.pid(user));
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.panel.updateProfile(this.pid(user), dto);
  }

  @Put('hours')
  setHours(@CurrentUser() user: JwtUser, @Body() dto: SetHoursDto) {
    return this.panel.setHours(this.pid(user), dto);
  }

  @Post('announcements')
  createAnnouncement(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.panel.createAnnouncement(this.pid(user), dto);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.panel.deleteAnnouncement(this.pid(user), id);
  }

  @Post('duty')
  createDuty(@CurrentUser() user: JwtUser, @Body() dto: CreateDutyDto) {
    return this.panel.createDuty(this.pid(user), dto);
  }

  @Delete('duty/:id')
  deleteDuty(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.panel.deleteDuty(this.pid(user), id);
  }

  @Get('services/catalog')
  serviceCatalog() {
    return this.panel.getServiceCatalog();
  }

  @Put('services')
  setServices(@CurrentUser() user: JwtUser, @Body() dto: SetServicesDto) {
    return this.panel.setServices(this.pid(user), dto);
  }

  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async uploadPhoto(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: UploadedImage,
  ) {
    const url = await this.images.processAndSave(file);
    return this.panel.addPhoto(this.pid(user), url);
  }

  @Delete('photos/:id')
  deletePhoto(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.panel.deletePhoto(this.pid(user), id);
  }

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async uploadLogo(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: UploadedImage,
  ) {
    const url = await this.images.processAndSave(file);
    return this.panel.setLogo(this.pid(user), url);
  }
}
