import { Controller, Get } from '@nestjs/common';
import { PromoService } from './promo.service';

// Publiczny: galeria promocyjna strony głównej (bez auth).
@Controller('promo-slides')
export class PromoController {
  constructor(private readonly promo: PromoService) {}

  @Get()
  list() {
    return this.promo.listActive();
  }
}
