/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import {
  NumberOptional,
  StringOptional,
} from 'src/decorators/dto.decorator';
import { CreateAttributeValueDto } from 'src/modules/attributes/dto/create-attribute-value.dto';
import { DeleteAttributeValueDto } from 'src/modules/attributes/dto/delete-attribute-value.dto';
import { UpdateAttributeValueDto } from 'src/modules/attributes/dto/update-attribute-value.dto';

export class UpdateCategoryDto {
  @StringOptional()
  name: string;

  @NumberOptional()
  departmentId?: number;

  @StringOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(CreateAttributeValueDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for variants:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => CreateAttributeValueDto)
  @ApiProperty({ type: [CreateAttributeValueDto], description: 'Attribute values' })
  addAttributes?: CreateAttributeValueDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
      if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(UpdateAttributeValueDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for variants:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => UpdateAttributeValueDto)
  @ApiProperty({ type: [UpdateAttributeValueDto], description: 'Attributes to update' })
  updateAttributes?: UpdateAttributeValueDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
   if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(DeleteAttributeValueDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for variants:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => DeleteAttributeValueDto)
  @ApiProperty({ type: [DeleteAttributeValueDto], description: 'Attributes to delete' })
  deleteAttributes?: DeleteAttributeValueDto[];
}
