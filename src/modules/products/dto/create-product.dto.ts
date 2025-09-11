import { NumberRequired, StringOptional } from "src/decorators/dto.decorator";
import { CreateProductVariantDto } from "./create-variant.dto";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateProductImageDto } from "./create-product-image.dto";

export class CreateProductDto {
  @StringOptional()
  name?: string;

  @StringOptional()
  description?: string;

  @NumberRequired('Price')
  price: number;

  @NumberRequired('Category id')
  categoryId: number;

  @NumberRequired('Brand id')
  brandId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  images: CreateProductImageDto[];
}