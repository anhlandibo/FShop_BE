import { IsInt, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  conversationId: number;

  @IsString()
  @MinLength(1)
  content: string;
}
