/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  NumberRequired,
  StringOptional,
  StringRequired,
} from 'src/decorators/dto.decorator';
import { CreateProductVariantDto } from './create-variant.dto';
import {
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @StringRequired('Product name')
  name: string;

  @StringOptional()
  description?: string;

  @IsNotEmpty()
  @NumberRequired('Product price')
  price: number;

  @NumberRequired('Category id')
  categoryId: number;

  @NumberRequired('Brand id')
  brandId: number;

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
  variants: CreateProductVariantDto[];
}
