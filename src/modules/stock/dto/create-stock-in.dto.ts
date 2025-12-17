import { IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StringOptional } from '../../../decorators/dto.decorator';
import { CreateStockInItemDto } from './create-stock-in-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockInDto {
  @ApiProperty({ type: [CreateStockInItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateStockInItemDto)
  items: CreateStockInItemDto[];

  @StringOptional()
  note?: string;
}
