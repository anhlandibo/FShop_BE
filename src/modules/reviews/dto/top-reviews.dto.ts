import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopReviewsDto {
  @ApiProperty({
    required: false,
    description: 'Number of top reviews to return',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Top must be an integer' })
  @Min(1, { message: 'Top must be at least 1' })
  @Max(100, { message: 'Top cannot exceed 100' })
  top?: number = 10;

  @ApiProperty({
    required: false,
    description: 'Filter by product ID (optional)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Product ID must be an integer' })
  productId?: number;
}
