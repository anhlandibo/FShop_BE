import { IsInt, IsNotEmpty } from "class-validator";

export class CartItemDto {
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsInt()
  @IsNotEmpty()
  variantId: number;
}