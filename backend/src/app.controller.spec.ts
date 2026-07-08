import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root health check', () => {
    it('zwraca status ok', () => {
      const status = appController.getStatus();
      expect(status.service).toBe('otoapteka-backend');
      expect(status.status).toBe('ok');
      expect(typeof status.timestamp).toBe('string');
    });
  });
});
