import { IsEnum, IsOptional } from 'class-validator';

export enum DateRange {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  MONTH = 'month',
  YEAR = 'year',
}

export class DashboardQueryDto {
  @IsEnum(DateRange)
  @IsOptional()
  range?: DateRange;
}
