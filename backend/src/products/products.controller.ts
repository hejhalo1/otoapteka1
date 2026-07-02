import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

// Kontroler = warstwa HTTP. Mapuje adresy URL na metody serwisu.
// @Controller('products') => wszystkie trasy zaczynają się od /products
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products  -> lista produktów z bazy
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // POST /products -> dodaje produkt; body: { "name": "...", "price": 1299 }
  @Post()
  create(@Body() body: { name: string; price: number }) {
    return this.productsService.create(body);
  }
}
