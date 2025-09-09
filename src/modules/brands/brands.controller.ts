import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { create } from 'domain';
import { CreateBrandDto } from './dto/create-brand.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { DeleteBrandsDto } from './dto/delete-brands.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() createBrandDto: CreateBrandDto, @UploadedFile() file?: Express.Multer.File) {
    return this.brandsService.create(createBrandDto, file);
  }

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.brandsService.findAll(query);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(@Param('id') id: number, @Body() updateBrandDto: UpdateBrandDto, @UploadedFile() file?: Express.Multer.File) {
    return this.brandsService.update(id, updateBrandDto, file);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.brandsService.delete(id);
  }

  @Post('many')
  deleteMany(@Body() deleteBrandsDto: DeleteBrandsDto) {
    return this.brandsService.deleteMany(deleteBrandsDto);
  }
}
