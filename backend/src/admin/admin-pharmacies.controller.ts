import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminPharmacyService } from './admin-pharmacy.service';
import {
  CreateAnnouncementDto,
  CreateDutyDto,
  UpdateProfileDto,
} from '../panel/dto/panel.dto';

// Admin (rola ADMIN) zarządza panelem dowolnej apteki po jej id.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/pharmacies')
export class AdminPharmaciesController {
  constructor(private readonly svc: AdminPharmacyService) {}

  @Get()
  search(@Query('q') q?: string) {
    return this.svc.search(q);
  }

  @Get(':pid')
  panel(@Param('pid') pid: string) {
    return this.svc.getPanel(pid);
  }

  @Put(':pid/profile')
  updateProfile(@Param('pid') pid: string, @Body() dto: UpdateProfileDto) {
    return this.svc.updateProfile(pid, dto);
  }

  @Post(':pid/announcements')
  createAnnouncement(
    @Param('pid') pid: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.svc.createAnnouncement(pid, dto);
  }

  @Delete(':pid/announcements/:id')
  deleteAnnouncement(@Param('pid') pid: string, @Param('id') id: string) {
    return this.svc.deleteAnnouncement(pid, id);
  }

  @Post(':pid/duty')
  createDuty(@Param('pid') pid: string, @Body() dto: CreateDutyDto) {
    return this.svc.createDuty(pid, dto);
  }

  @Delete(':pid/duty/:id')
  deleteDuty(@Param('pid') pid: string, @Param('id') id: string) {
    return this.svc.deleteDuty(pid, id);
  }
}
