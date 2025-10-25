import { Transform } from "class-transformer";
import { IsDecimal, Min, Max } from "class-validator";
import { IntegerRequired, NumberRequired, StringOptional } from "src/decorators/dto.decorator";

export class CreateReviewDto {
  @IntegerRequired('Product ID')
  productId: number

  @NumberRequired('Rating', 0.5, 5)
  rating: number;

  @StringOptional()
  comment?: string;
}