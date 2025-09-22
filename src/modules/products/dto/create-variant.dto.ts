import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { NumberRequired, StringRequired } from 'src/decorators/dto.decorator';
import { AttributeCategoryDto } from 'src/modules/attributes/dto/attribute-category.dto';

export class CreateProductVariantDto {
  @IsNotEmpty()
  @NumberRequired('Quantity')
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeCategoryDto)
  attributes: AttributeCategoryDto[];
}
