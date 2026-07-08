import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /api -> prosty health check.
  @Get()
  getStatus(): { service: string; status: string; timestamp: string } {
    return this.appService.getStatus();
  }
}
