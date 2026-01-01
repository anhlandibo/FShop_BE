import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReplyDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  content: string;
}
