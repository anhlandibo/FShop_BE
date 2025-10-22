/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PartialType } from "@nestjs/swagger";
import { CreateProductDto } from "./create-product.dto";
import { NumberOptional, StringOptional } from "src/decorators/dto.decorator";
import { plainToInstance, Transform, Type } from "class-transformer";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { CreateProductVariantDto } from "./create-variant.dto";
import { UpdateProductVariantDto } from "./update-variant.dto";

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @StringOptional()
  name?: string;

  @StringOptional()
  description?: string;

  @NumberOptional()
  price?: number;

  @NumberOptional()
  categoryId?: number;

  @NumberOptional()
  brandId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(CreateProductVariantDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for variants:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => CreateProductVariantDto)
  newVariants?: CreateProductVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(UpdateProductVariantDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for variants:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => UpdateProductVariantDto)
  updatedVariants?: UpdateProductVariantDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseJson<number[]>(value, []))
  deletedVariantIds?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseJson<number[]>(value, []))
  updatedProductIds?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseJson<number[]>(value, []))
  deletedProductIds?: number[];
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return (value as T) ?? fallback;
}