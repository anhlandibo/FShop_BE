/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { plainToInstance, Transform, Type } from "class-transformer";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { NumberOptional, NumberRequired } from "src/decorators/dto.decorator";
import { AttributeCategoryDto } from "src/modules/attributes/dto/attribute-category.dto";

export class UpdateProductVariantDto {
  @NumberOptional()
  id?: number;

  @NumberOptional()
  quantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    // ← THÊM TRANSFORM NÀY
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(AttributeCategoryDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for attributes:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => AttributeCategoryDto)
  attributes?: AttributeCategoryDto[];
}