import { NumberRequired, StringOptional } from "src/decorators/dto.decorator";

export class UpdateAttributeValueDto {
  @NumberRequired('Attribute Id')
  attributeId: number;

  @StringOptional()
  value?: string;
}