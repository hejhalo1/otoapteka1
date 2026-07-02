import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global sprawia, że PrismaService jest dostępny w całej aplikacji
// bez importowania PrismaModule w każdym module z osobna.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
