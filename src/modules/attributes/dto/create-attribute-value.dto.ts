import { NumberRequired, StringRequired } from "src/decorators/dto.decorator";

export class CreateAttributeValueDto {
  @NumberRequired('Attribute Id')
  attributeId: number;

  @StringRequired('Value')
  value: string;
}