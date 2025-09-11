/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryDto } from 'src/dto/query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  create(@Body() body: any, @UploadedFiles() images: Array<Express.Multer.File>) {
    const createProductDto = new CreateProductDto();
    createProductDto.name = body.name;
    createProductDto.description = body.description;
    createProductDto.price = parseFloat(body.price);
    createProductDto.categoryId = parseInt(body.categoryId, 10);
    createProductDto.brandId = parseInt(body.brandId, 10);
    createProductDto.variants = JSON.parse(body.variants);
    return this.productsService.create(createProductDto, images);
  }

  @Get()
  findAll(@Query()query: QueryDto) {
    return this.productsService.findAll(query);
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.productsService.delete(id);
  }
}
