import { Transform } from "class-transformer";
import { BooleanOptional, NumberOptional, StringOptional, StringRequired } from "src/decorators/dto.decorator";

export class UpdateCategoryDto {
  @StringOptional()
  name: string;

  @Transform(({ value }) => value === '' ? null : value ? Number(value) : null)
  @NumberOptional()
  parentId?: number | null;

  @StringOptional()
  imageUrl?: string;

  @StringOptional()
  description?: string;

  @BooleanOptional()
  isActive?: boolean;
}