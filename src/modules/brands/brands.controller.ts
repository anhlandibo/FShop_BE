import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { QueryDto } from 'src/dto/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBrandDto, UpdateBrandDto, DeleteBrandsDto } from './dto';
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiCreatedResponse({description: 'Brand created successfully'})
  @ApiConflictResponse({description: 'Brand already exists'})
  create(@Body() createBrandDto: CreateBrandDto, @UploadedFile() image: Express.Multer.File) {
    return this.brandsService.create(createBrandDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  findAll(@Query() query: QueryDto) {
    return this.brandsService.findAll(query);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({summary: 'Update brand'})
  @ApiNotFoundResponse({description: 'Brand not found'})
  update(@Param('id') id: number, @Body() updateBrandDto: UpdateBrandDto, @UploadedFile() image: Express.Multer.File) {
    return this.brandsService.update(id, updateBrandDto, image);
  }

  @Delete(':id')
  @ApiOperation({summary: 'Delete brand'})
  @ApiNotFoundResponse({description: 'Brand not found'})
  delete(@Param('id') id: number) {
    return this.brandsService.delete(id);
  }

  @Post('remove-multiple')
  @ApiOperation({summary: 'Delete many brands'})
  @ApiNotFoundResponse({description: 'Brand not found'})
  deleteMany(@Body() deleteBrandsDto: DeleteBrandsDto) {
    return this.brandsService.deleteMany(deleteBrandsDto);
  }

  @Get(':id')
  @ApiOperation({summary: 'Get brand by id'})
  @ApiNotFoundResponse({description: 'Brand not found'})
  getById(@Param('id') id: number) {
    return this.brandsService.getById(id);
  }

  @Get(':slug')
  @ApiOperation({summary: 'Get brand by slug'})
  @ApiNotFoundResponse({description: 'Brand not found'})
  getBySlug(@Param('slug') slug: string) {
    return this.brandsService.getBySlug(slug);
  }
}
