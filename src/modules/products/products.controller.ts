/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UploadedFiles, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
    { name: 'variantImages', maxCount: 50 },
    { name: 'productImages', maxCount: 50 },
  ]),)
  update(
    @Param('id') id: number, 
    @Body() dto: UpdateProductDto, 
    @UploadedFiles()
    files: {
      variantImages?: Express.Multer.File[];
      productImages?: Express.Multer.File[];
    },){
    return this.productsService.update(
      id,
      dto,
      files.variantImages || [],
      files.productImages || []
    );
  }

  @Post('search/image') 
  @ApiOperation({ summary: 'Search products by image using AI' })
  @UseInterceptors(FileInterceptor('image')) 
  searchByImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.productsService.searchByImage(file);
  }
}
