import { Transform } from 'class-transformer';
import {
  NumberOptional,
  StringOptional,
} from 'src/decorators/dto.decorator';

export class UpdateCategoryDto {
  @StringOptional()
  name: string;

  @Transform(({ value }) =>
    value === '' ? null : value ? Number(value) : null,
  )
  @NumberOptional()
  parentId?: number | null;

  @StringOptional()
  description?: string;
}
