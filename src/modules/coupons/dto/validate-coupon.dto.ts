import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { NumberRequired, StringRequired } from "src/decorators/dto.decorator";
import { CartItemDto } from "src/modules/carts/dto";

export class ValidateCouponDto {
  @StringRequired('Coupon Code')
  code: string;
}