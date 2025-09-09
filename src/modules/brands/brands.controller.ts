import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { create } from 'domain';
import { CreateBrandDto } from './dto/create-brand.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { DeleteBrandsDto } from './dto/delete-brands.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.brandsService.findAll(query);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
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
