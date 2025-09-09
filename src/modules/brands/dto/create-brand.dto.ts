import { StringRequired, NumberOptional, StringOptional, BooleanOptional } from "src/decorators/dto.decorator";

export class CreateBrandDto {
  @StringRequired('Brand name')
  name: string;

  @StringOptional()
  imageUrl?: string;

  @StringOptional()
  description?: string;

  @BooleanOptional()
  isActive?: boolean;
}
