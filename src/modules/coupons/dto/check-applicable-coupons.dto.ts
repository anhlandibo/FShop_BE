import { IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @IsNumber()
  variantId: number;

  @IsNumber()
  quantity: number;
}

export class CheckApplicableCouponsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
