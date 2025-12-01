import { NumberRequired, StringOptional, StringRequired } from "src/decorators/dto.decorator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "src/constants/payment-method.enum";

export class CreateOrderDto {
  @NumberRequired('Address Id')
  addressId: number

  @StringOptional()
  note?: string

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
  
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]
}