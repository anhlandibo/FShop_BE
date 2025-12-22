import { IsOptional, IsIn } from 'class-validator';
import { QueryDto } from 'src/dto/query.dto';
import { ApiProperty } from '@nestjs/swagger';

export class QueryPostsDto extends QueryDto {
  @ApiProperty({
    required: false,
    enum: ['newest', 'popular'],
    description: 'Sort by newest (createdAt DESC) or popular (totalLikes DESC)',
  })
  @IsOptional()
  @IsIn(['newest', 'popular'])
  sortType?: 'newest' | 'popular';
}
