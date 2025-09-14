import { NumberRequired, StringOptional } from "src/decorators/dto.decorator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { ArrayNotEmpty, IsArray } from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderDto {
  @NumberRequired('Address Id')
  addressId: number

  @StringOptional()
  note?: string
  
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]
}