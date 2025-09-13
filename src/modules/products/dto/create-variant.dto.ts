import { IsInt, IsNotEmpty } from 'class-validator';
import { NumberRequired, StringRequired } from 'src/decorators/dto.decorator';

export class CreateProductVariantDto {
  @StringRequired('Size')
  size: string;

  @StringRequired('Color')
  color: string;

  @IsNotEmpty()
  @NumberRequired('Product price')
  quantity: number;

  @IsInt()
  price: number;
}
