import { NumberOptional, NumberRequired, StringOptional } from "src/decorators/dto.decorator";

export class CreateProductVariantDto {
  @StringOptional()
  size?: string;

  @StringOptional()
  color?: string;

  @NumberRequired('Quantity')
  quantity: number;

  @NumberRequired('Remaining')
  remaining: number;

  @NumberOptional()
  price?: number;
}