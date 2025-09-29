import { IsInt, IsNotEmpty } from "class-validator";
import { IntegerRequired } from "src/decorators/dto.decorator";

export class CartItemDto {
  // @IsInt()
  // @IsNotEmpty()
  @IntegerRequired('Quantity')
  quantity: number;

  // @IsInt()
  // @IsNotEmpty()
  @IntegerRequired('Variant ID')
  variantId: number;
}