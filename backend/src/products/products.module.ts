import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

// Moduł spina kontroler i serwis w jedną całość.
// PrismaService nie jest tu importowany, bo PrismaModule jest @Global.
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
