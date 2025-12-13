/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NumberOptional } from "src/decorators/dto.decorator";
import { QueryDto } from "./query.dto";
import { ArrayNotEmpty, IsArray, IsInt, IsOptional } from "class-validator";
import { Transform, Type } from "class-transformer";

export class ProductQueryDto extends QueryDto {
    @NumberOptional()
    categoryId?: number;

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @Transform(({ value }) => {
      if (typeof value === 'string') {
        return value.split(',').map((v) => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
      }
      return value;
    })
    @IsInt({ each: true })
    attributeCategoryIds?: number[];

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @Transform(({ value }) => {
      if (typeof value === 'string') {
        return value.split(',').map((v) => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
      }
      return value;
    })
    @IsInt({ each: true })
    brandIds?: number[];

    @NumberOptional()
    minPrice?: number

    @NumberOptional()
    maxPrice?: number;
}