import { StringOptional } from "src/decorators/dto.decorator";

export class UpdateAttributeDto {
  @StringOptional()
  name?: string
}