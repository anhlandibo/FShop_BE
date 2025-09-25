import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributesService.create(createAttributeDto);
  }

  @Get()
  getAll(@Query() query: QueryDto) {
    return this.attributesService.getAll(query);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateAttributeDto: UpdateAttributeDto) {
    return this.attributesService.update(id, updateAttributeDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.attributesService.delete(id);
  }

  
}
