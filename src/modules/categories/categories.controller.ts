import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { QueryDto } from 'src/dto/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoriesDto } from './dto';
import { AttributesService } from '../attributes/attributes.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService, private readonly attributesService: AttributesService){ }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFile() image: Express.Multer.File) {
    return this.categoriesService.create(createCategoryDto, image);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: number, @Body() updateCategoryDto: UpdateCategoryDto, @UploadedFile() image?: Express.Multer.File) {
    return this.categoriesService.update(id, updateCategoryDto, image);
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.categoriesService.delete(id);
  }

  @Post("remove-multiple")
  removeMultiple(@Body() deleteCategoriesDto: DeleteCategoriesDto) {
    return this.categoriesService.removeMultiple(deleteCategoriesDto);
  }

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  getById(@Param('id') id: number) {
    return this.categoriesService.getById(id);
  }

  @Get('slugs/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }

  @Get(':categoryId/attributes')
  getAttributeCategories(@Param('categoryId') categoryId: number) {
    return this.attributesService.getAttributeCategories(categoryId);
  }

  @Get(':categoryId/attributes/:attributeId')
  getAttributeCategory(
    @Param('categoryId') categoryId: number,
    @Param('attributeId') attributeId: number,
  ) {
    return this.attributesService.getAttributeCategory(categoryId, attributeId);
  }

  @Get('slug/:slug/attributes')
  getAttributeCategoriesBySlug(@Param('slug') slug: string) {
    return this.attributesService.getAttributeCategoriesBySlug(slug);
  }
}
