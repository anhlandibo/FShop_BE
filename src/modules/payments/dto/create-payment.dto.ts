import { NumberRequired } from 'src/decorators/dto.decorator';

export class CreatePaypalPaymentDto {
  @NumberRequired('Order Id')
  orderId: number;
}
