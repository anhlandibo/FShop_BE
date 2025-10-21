import { NumberRequired, StringRequired } from "src/decorators/dto.decorator";

export class ApplyCouponDto {
  @StringRequired('Coupon DTO')
  code: string;

  @NumberRequired('Order ID')
  orderId: number;
}