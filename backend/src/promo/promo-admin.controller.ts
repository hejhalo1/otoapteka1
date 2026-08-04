import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ImageService, MAX_UPLOAD_BYTES } from '../panel/image.service';
import { PromoService } from './promo.service';
import { CreatePromoSlideDto, UpdatePromoSlideDto } from './dto/promo.dto';

interface UploadedImage {
  buffer: Buffer;
  size: number;
}

// Admin: zarządzanie galerią promocyjną. Obraz przez ten sam pipeline co zdjęcia aptek.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/promo-slides')
export class PromoAdminController {
  constructor(
    private readonly promo: PromoService,
    private readonly images: ImageService,
  ) {}

  @Get()
  list() {
    return this.promo.listAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async create(
    @UploadedFile() file: UploadedImage,
    @Body() dto: CreatePromoSlideDto,
  ) {
    const imageUrl = await this.images.processAndSave(file);
    return this.promo.create(imageUrl, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromoSlideDto) {
    return this.promo.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promo.remove(id);
  }
}
