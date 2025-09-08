import { BooleanOptional, NumberOptional, StringOptional, StringRequired } from "src/decorators/dto.decorator";

export class CreateCategoryDto {
  @StringRequired('Category name')
  name: string;

  @NumberOptional()
  parentId?: number;

  @StringOptional()
  imageUrl?: string;

  @StringOptional()
  description?: string;

  @BooleanOptional()
  isActive?: boolean;
}