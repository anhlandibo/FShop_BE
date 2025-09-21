import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createDepartmentDto: CreateDepartmentDto, @UploadedFile() image: Express.Multer.File) {
    return this.departmentsService.create(createDepartmentDto, image);
  }

  @Get('all')
  findAll(@Query() queryDto: QueryDto) {
    return this.departmentsService.findAll(queryDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: number, @Body() updateDepartmentDto: UpdateDepartmentDto, @UploadedFile() image: Express.Multer.File) {
    return this.departmentsService.update(id, updateDepartmentDto, image);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.departmentsService.delete(id);
  }

  @Get(':id')
  getById(@Param('id') id: number) {
    return this.departmentsService.getById(id);
  }

  @Get('slugs/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.departmentsService.getBySlug(slug);
  }
}
