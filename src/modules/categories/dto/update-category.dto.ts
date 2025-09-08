import { BooleanOptional, NumberOptional, StringOptional, StringRequired } from "src/decorators/dto.decorator";

export class UpdateCategoryDto {
  @StringOptional()
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