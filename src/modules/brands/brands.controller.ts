import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { QueryDto } from 'src/dto/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBrandDto, UpdateBrandDto, DeleteBrandsDto } from './dto';

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
