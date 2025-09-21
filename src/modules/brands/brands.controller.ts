import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { QueryDto } from 'src/dto/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBrandDto, UpdateBrandDto, DeleteBrandsDto } from './dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createBrandDto: CreateBrandDto, @UploadedFile() image: Express.Multer.File) {
    return this.brandsService.create(createBrandDto, image);
  }

  @Get('all')
  findAll(@Query() query: QueryDto) {
    return this.brandsService.findAll(query);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: number, @Body() updateBrandDto: UpdateBrandDto, @UploadedFile() image: Express.Multer.File) {
    return this.brandsService.update(id, updateBrandDto, image);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.brandsService.delete(id);
  }

  @Post('many')
  deleteMany(@Body() deleteBrandsDto: DeleteBrandsDto) {
    return this.brandsService.deleteMany(deleteBrandsDto);
  }

  @Get(':id')
  getById(@Param('id') id: number) {
    return this.brandsService.getById(id);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.brandsService.getBySlug(slug);
  }
}
