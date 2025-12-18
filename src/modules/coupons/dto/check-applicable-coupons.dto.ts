import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderItemDto } from 'src/modules/orders/dto/create-order-item.dto';

export class CheckApplicableCouponsDto {
  @ApiProperty({
    description: 'List of items with variantId and quantity',
    type: [CreateOrderItemDto],
    example: [
      { variantId: 1, quantity: 2 },
      { variantId: 3, quantity: 1 }
    ]
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
