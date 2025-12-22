import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({ example: 'What is the best product in the store?' })
  @IsString()
  @IsNotEmpty()
  question: string;
}