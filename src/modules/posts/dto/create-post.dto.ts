import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ArrayMaxSize(10)
  productIds?: number[];
}
