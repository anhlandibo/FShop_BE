/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { QueryDto } from 'src/dto/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoriesDto } from './dto';
import { AttributesService } from '../attributes/attributes.service';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService, private readonly attributesService: AttributesService) { }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new category' })
  @ApiConflictResponse({description: 'Category already exist'})
  @ApiNotFoundResponse({description: 'Department not found'})
  create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFile() image: Express.Multer.File) {
    return this.categoriesService.create(createCategoryDto, image);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({summary: 'Update category'})
  update(@Param('id') id: number, @Body() updateCategoryDto: UpdateCategoryDto, @UploadedFile() image?: Express.Multer.File) {
    return this.categoriesService.update(id, updateCategoryDto, image);
  }

  @Delete(":id")
  @ApiOperation({summary: 'Delete category'})
  @ApiNotFoundResponse({description: 'Category not found'})
  remove(@Param("id") id: number) {
    return this.categoriesService.delete(id);
  }

  @Post("remove-multiple")
  @ApiOperation({summary: 'Delete multiple categories'})
  @ApiNotFoundResponse({description: 'Not found any categories'})
  removeMultiple(@Body() deleteCategoriesDto: DeleteCategoriesDto) {
    return this.categoriesService.removeMultiple(deleteCategoriesDto);
  }

  @Get()
  @ApiOperation({summary: 'Get all categories'})
  findAll(@Query() query: QueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({summary: 'Get category by id'})
  @ApiNotFoundResponse({description: 'Category not found'})
  getById(@Param('id') id: number) {
    return this.categoriesService.getById(id);
  }

  @Get('slugs/:slug')
  @ApiOperation({summary: 'Get category by slug'})
  @ApiNotFoundResponse({description: 'Category not found'})
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }

  @Get(':categoryId/attributes')
  @ApiOperation({summary: 'Get attribute categories by category id'})
  @ApiNotFoundResponse({description: 'Category not found'})
  getAttributeCategories(@Param('categoryId') categoryId: number) {
    return this.attributesService.getAttributeCategories(categoryId);
  }

  @Get(':categoryId/attributes/:attributeId')
  @ApiOperation({summary: 'Get attribute category by category id and attribute id'})
  @ApiNotFoundResponse({description: 'Category or not found'})
  getAttributeCategory(@Param('categoryId') categoryId: number,@Param('attributeId') attributeId: number) {
    return this.attributesService.getAttributeCategory(categoryId, attributeId);
  }

  @Get('slug/:slug/attributes')
  @ApiOperation({summary: 'Get attribute categories by slug'})
  @ApiNotFoundResponse({description: 'Category not found'})
  getAttributeCategoriesBySlug(@Param('slug') slug: string) {
    return this.attributesService.getAttributeCategoriesBySlug(slug);
  }
}
