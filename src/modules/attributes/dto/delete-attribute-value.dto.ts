import { NumberRequired, StringRequired } from "src/decorators/dto.decorator";

export class DeleteAttributeValueDto {
  @NumberRequired('Attribute Category Id')
  attributeCategoryId: number;
}