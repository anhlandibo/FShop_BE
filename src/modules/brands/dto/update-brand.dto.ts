import { StringRequired, NumberOptional, StringOptional, BooleanOptional } from "src/decorators/dto.decorator";

export class UpdateBrandDto {
  @StringOptional()
  name?: string;

  @StringOptional()
  description?: string;
}
