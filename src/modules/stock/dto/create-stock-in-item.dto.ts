import { NumberRequired } from '../../../decorators/dto.decorator';

export class CreateStockInItemDto {
  @NumberRequired('Variant ID')
  variantId: number;

  @NumberRequired('Quantity', 1)
  quantity: number;
}
