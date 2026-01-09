import { IsEnum } from 'class-validator';
import { ReactionType } from 'src/constants';

export class CreateReactionDto {
  @IsEnum(ReactionType, { message: 'Invalid reaction type' })
  type: ReactionType;
}
