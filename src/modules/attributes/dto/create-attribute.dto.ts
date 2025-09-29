import { ApiOperation } from "@nestjs/swagger";
import { StringRequired } from "src/decorators/dto.decorator";

export class CreateAttributeDto {
  @StringRequired('Attribute name')
  name: string;
}