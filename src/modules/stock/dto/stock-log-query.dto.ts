import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../dto/query.dto';
import { StockLogType } from '../../../constants/stock-log-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class StockLogQueryDto extends QueryDto {
  @ApiProperty({ required: false, enum: StockLogType })
  @IsOptional()
  @IsEnum(StockLogType)
  type?: StockLogType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  variantId?: number;
}
