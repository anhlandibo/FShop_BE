import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new department' })
  @ApiConflictResponse({description: 'Department already exists'})
  create(@Body() createDepartmentDto: CreateDepartmentDto, @UploadedFile() image: Express.Multer.File) {
    return this.departmentsService.create(createDepartmentDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  findAll(@Query() queryDto: QueryDto) {
    return this.departmentsService.findAll(queryDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({summary: 'Update department'})
  @ApiNotFoundResponse({description: 'Department not found'})
  update(@Param('id') id: number, @Body() updateDepartmentDto: UpdateDepartmentDto, @UploadedFile() image: Express.Multer.File) {
    return this.departmentsService.update(id, updateDepartmentDto, image);
  }

  @Delete(':id')
  @ApiOperation({summary: 'Delete department'})
  @ApiNotFoundResponse({description: 'Department not found'})
  delete(@Param('id') id: number) {
    return this.departmentsService.delete(id);
  }

  @Get(':id')
  @ApiOperation({summary: 'Get department by id'})
  @ApiNotFoundResponse({description: 'Department not found'})
  getById(@Param('id') id: number) {
    return this.departmentsService.getById(id);
  }

  @Get('slugs/:slug')
  @ApiOperation({summary: 'Get department by slug'})
  @ApiNotFoundResponse({description: 'Department not found'})
  getBySlug(@Param('slug') slug: string) {
    return this.departmentsService.getBySlug(slug);
  }
}
