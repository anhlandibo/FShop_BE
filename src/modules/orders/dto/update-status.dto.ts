import { IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "src/constants";

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status: OrderStatus

  @IsOptional()
  reason?: string
}