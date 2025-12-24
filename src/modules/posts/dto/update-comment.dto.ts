import { StringRequired } from 'src/decorators/dto.decorator';

export class UpdateCommentDto {
  @StringRequired('Content')
  content: string;
}
