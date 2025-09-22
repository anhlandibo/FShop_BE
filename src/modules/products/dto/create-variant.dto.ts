import { IsInt, IsNotEmpty } from 'class-validator';
import { NumberRequired, StringRequired } from 'src/decorators/dto.decorator';

export class CreateProductVariantDto {
  @IsNotEmpty()
  @NumberRequired('Quantity')
  quantity: number;

  @IsNotEmpty()
  @NumberRequired('Attribute Category')
  attributeCategoryId: number
}
