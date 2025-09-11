import { StringOptional } from "src/decorators/dto.decorator";

export class CreateProductImageDto {
  @StringOptional()
  imageUrl?: string;
}