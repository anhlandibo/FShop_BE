import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from 'src/dto/query.dto';
import { DiscountType } from 'src/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MyCouponsQueryDto extends QueryDto {
  @ApiPropertyOptional({
    enum: DiscountType,
    description: 'Filter by discount type'
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;
}
