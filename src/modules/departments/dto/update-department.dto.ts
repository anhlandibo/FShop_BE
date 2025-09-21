import { StringOptional } from "src/decorators/dto.decorator";

export class UpdateDepartmentDto {
  @StringOptional()
  name?: string;

  @StringOptional()
  description?: string;
}