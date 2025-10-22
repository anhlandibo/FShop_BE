/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { plainToInstance, Transform, Type } from "class-transformer";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { NumberOptional, NumberRequired } from "src/decorators/dto.decorator";
import { AttributeCategoryDto } from "src/modules/attributes/dto/attribute-category.dto";

export class UpdateProductVariantDto {
  @NumberRequired('Variant id')
  id: number;

  @NumberOptional()
  quantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeCategoryDto)
  attributes?: AttributeCategoryDto[];
}