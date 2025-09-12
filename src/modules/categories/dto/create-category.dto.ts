import { NumberOptional, StringOptional, StringRequired } from "src/decorators/dto.decorator";

export class CreateCategoryDto {
  @StringRequired('Category name')
  name: string;

  @NumberOptional()
  parentId?: number;

  @StringOptional()
  description?: string;

}