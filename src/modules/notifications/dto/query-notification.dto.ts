import { IsIn, IsOptional } from 'class-validator';
import { QueryDto } from 'src/dto/query.dto';

export class QueryNotificationDto extends QueryDto {
  @IsOptional()
  @IsIn(['createdAt', 'isRead'])
  declare sortBy?: 'createdAt' | 'isRead';
}
