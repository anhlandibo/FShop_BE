import { StringOptional, StringRequired } from "src/decorators/dto.decorator";

export class CreateDepartmentDto {
  @StringRequired('Department name')
  name: string;

  @StringOptional()
  description?: string;
}