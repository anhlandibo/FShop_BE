import { NumberRequired, StringOptional } from "src/decorators/dto.decorator";

export class UpdateAttributeValueDto {
  @NumberRequired('Attribute Category Id')
  attributeCategoryId: number;

  @StringOptional()
  value?: string;
}