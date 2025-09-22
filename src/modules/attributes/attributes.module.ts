import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity';
import { AttributeCategory } from './entities/attribute-category.entity';
import { VariantAttributeValue } from '../products/entities/variant-attribute-value.entity';

@Module({
  controllers: [AttributesController],
  providers: [AttributesService],
  imports: [TypeOrmModule.forFeature([Attribute, AttributeCategory, VariantAttributeValue])]
})
export class AttributesModule {}
