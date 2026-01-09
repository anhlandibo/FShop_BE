import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LivestreamStatus } from 'src/constants';

export class QueryLivestreamDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsEnum(LivestreamStatus)
  status?: LivestreamStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;
}
