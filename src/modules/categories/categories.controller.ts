import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryDto } from 'src/dto/query.dto';
import { DeleteCategoriesDto } from './dto/delete-categories.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFile() file?: Express.Multer.File) {
    return this.categoriesService.create(createCategoryDto, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(@Param('id') id: number, @Body() updateCategoryDto: UpdateCategoryDto, @UploadedFile() file?: Express.Multer.File) {
    return this.categoriesService.update(id, updateCategoryDto, file);
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.categoriesService.remove(id);
  }

  @Post("remove-multiple")
  removeMultiple(@Body() deleteCategoriesDto: DeleteCategoriesDto) {
    return this.categoriesService.removeMultiple(deleteCategoriesDto);
  }

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.categoriesService.findAll(query);
  }
}
