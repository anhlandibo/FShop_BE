/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFiles, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryDto } from 'src/dto/query.dto';
import { plainToClass } from 'class-transformer';
import { ProductQueryDto } from 'src/dto/productQuery.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'variantImages', maxCount: 20 },
  ]),)
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      images?: Array<Express.Multer.File>;
      variantImages?: Array<Express.Multer.File>;
    },
  ) {
    console.log(createProductDto);
    return this.productsService.create(
      createProductDto,
      files.images ?? [],
      files.variantImages ?? [],
    );
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  getProductById(@Param('id') id: number) {
    return this.productsService.getProductById(id);
  }


  /* @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productsService.delete(id);
  } */


}
