import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { service: string; status: string; timestamp: string } {
    return {
      service: 'otoapteka-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
