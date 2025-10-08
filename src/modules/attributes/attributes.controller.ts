import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  @ApiOperation({ summary: 'Create attribute' })
  @ApiCreatedResponse({description: 'Attribute created successfully'})
  @ApiConflictResponse({description: 'Attribute name already exist'})
  create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributesService.create(createAttributeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attributes' })
  getAll(@Query() query: QueryDto) {
    return this.attributesService.getAll(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update attribute' })
  @ApiNotFoundResponse({description: 'Attribute not found'})
  update(@Param('id') id: number, @Body() updateAttributeDto: UpdateAttributeDto) {
    return this.attributesService.update(id, updateAttributeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attribute' })
  @ApiNotFoundResponse({description: 'Attribute not found'})
  delete(@Param('id') id: number) {
    return this.attributesService.delete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attribute by id' })
  @ApiNotFoundResponse({description: 'Attribute not found'})
  getAttributeById(@Param('id') id: number) {
    return this.attributesService.getAttributeById(id);
  }

  
}
