import { StringRequired, NumberRequired } from "src/decorators/dto.decorator";

export class RedeemCouponDto {
  @StringRequired('Coupon Code')
  code: string;

  @NumberRequired('Order ID')
  orderId: number;
}