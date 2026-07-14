import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/auth.types';
import { AdminService } from './admin.service';
import { ModerateDto, ReviewClaimDto, SetActiveDto } from './dto/admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('claims')
  claims(@Query('status') status?: string) {
    return this.admin.listClaims(status);
  }

  @Post('claims/:id/review')
  reviewClaim(@Param('id') id: string, @Body() dto: ReviewClaimDto) {
    return this.admin.reviewClaim(id, dto);
  }

  @Get('announcements')
  announcements(@Query('status') status?: string) {
    return this.admin.listAnnouncements(status ?? 'PENDING');
  }

  @Post('announcements/:id/moderate')
  moderateAnnouncement(@Param('id') id: string, @Body() dto: ModerateDto) {
    return this.admin.moderateAnnouncement(id, dto);
  }

  @Get('photos')
  photos(@Query('status') status?: string) {
    return this.admin.listPhotos(status ?? 'PENDING');
  }

  @Post('photos/:id/moderate')
  moderatePhoto(@Param('id') id: string, @Body() dto: ModerateDto) {
    return this.admin.moderatePhoto(id, dto);
  }

  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Post('users/:id/active')
  setActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.admin.setUserActive(id, Boolean(dto.isActive));
  }

  @Post('sync')
  triggerSync(@CurrentUser() user: JwtUser) {
    return this.admin.triggerSync(user.sub);
  }

  @Get('sync-runs')
  syncRuns() {
    return this.admin.listSyncRuns();
  }
}
