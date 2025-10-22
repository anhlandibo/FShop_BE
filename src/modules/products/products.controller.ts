/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryDto } from 'src/dto/query.dto';
import { plainToClass } from 'class-transformer';
import { ProductQueryDto } from 'src/dto/productQuery.dto';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'variantImages', maxCount: 20 },
  ]),)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConflictResponse({ description: 'Product already exists' })
  @ApiNotFoundResponse({ description: 'Brand or category not found' })
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
  @ApiOperation({ summary: 'Get all products' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  getProductById(@Param('id') id: number) {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'newVariantImages', maxCount: 50 },
    { name: 'updatedVariantImages', maxCount: 50 },
    { name: 'newProductImages', maxCount: 50 },
  { name: 'updateProductImages', maxCount: 50 },
  ]),)
  update(
    @Param('id') id: number, 
    @Body() dto: UpdateProductDto, 
    @UploadedFiles()
    files: {
      newVariantImages?: Express.Multer.File[];
      updatedVariantImages?: Express.Multer.File[];
      newProductImages?: Express.Multer.File[];
      updateProductImages?: Express.Multer.File[];
    },){
      const {
      newVariantImages = [],
      updatedVariantImages = [],
      newProductImages = [],
      updateProductImages = [],
    } = files || {};
    return this.productsService.update(
      id,
      dto,
      newVariantImages,
      updatedVariantImages,
      newProductImages,
      updateProductImages,
    );
  }
}
