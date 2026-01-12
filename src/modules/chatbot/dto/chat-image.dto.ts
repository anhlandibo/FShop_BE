import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatImageDto {
  @ApiProperty({ 
    example: 'Do you have similar items?', 
    description: 'Optional text message accompanying the image',
    required: false
  })
  @IsString()
  @IsOptional()
  message?: string;
}
