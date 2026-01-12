import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatVoiceDto {
  @ApiProperty({ 
    description: 'Optional additional text context',
    required: false
  })
  @IsString()
  @IsOptional()
  context?: string;
}
