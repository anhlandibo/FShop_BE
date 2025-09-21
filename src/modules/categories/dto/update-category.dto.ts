import { Transform } from 'class-transformer';
import {
  NumberOptional,
  StringOptional,
} from 'src/decorators/dto.decorator';

export class UpdateCategoryDto {
  @StringOptional()
  name: string;

  @NumberOptional()
  departmentId?: number;

  @StringOptional()
  description?: string;
}
