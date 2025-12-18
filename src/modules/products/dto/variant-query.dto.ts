// src/modules/products/dto/product-variant-query.dto.ts
import { QueryDto } from 'src/dto/query.dto'; // Import file QueryDto bạn cung cấp
import { NumberOptional } from 'src/decorators/dto.decorator';

export class ProductVariantQueryDto extends QueryDto {
  @NumberOptional()
  productId?: number;
}