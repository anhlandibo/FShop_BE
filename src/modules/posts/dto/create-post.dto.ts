/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, IsNumber, ArrayMaxSize } from 'class-validator';
import { StringRequired } from 'src/decorators/dto.decorator';

export class CreatePostDto {
  @StringRequired('Content')
  content: string;

  @ApiProperty({
    required: false,
    type: [Number],
    description: 'Array of product IDs to tag in the post',
    example: [1, 2, 3],
  })
  @IsOptional()
  @Transform(({ obj }) => {
    const val = obj.productIds ?? obj['productIds[]'];
    if (!val) return [];
    if (Array.isArray(val)) return val.map(Number);
    return [Number(val)];
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ArrayMaxSize(10)
  productIds?: number[];
}
