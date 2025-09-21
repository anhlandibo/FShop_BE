import { NumberOptional, NumberRequired, StringOptional, StringRequired } from "src/decorators/dto.decorator";

export class CreateCategoryDto {
  @StringRequired('Category name')
  name: string;

  @NumberRequired('Department id')
  departmentId: number;

  @StringOptional()
  description?: string;
}
