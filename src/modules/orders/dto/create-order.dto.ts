import { NumberRequired, StringOptional, StringRequired } from "src/decorators/dto.decorator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "src/constants/payment-method.enum";
import { ShippingMethod } from "src/constants";

export class CreateOrderDto {
  @NumberRequired('Address Id')
  addressId: number

  @StringOptional()
  note?: string

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]
}