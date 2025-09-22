import { NumberRequired } from "src/decorators/dto.decorator";

export class AttributeCategoryDto {
  @NumberRequired('Attribute Category Id')
  attributeCategoryId: number;
}