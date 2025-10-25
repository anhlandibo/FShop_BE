import { Type } from "class-transformer";
import { IsOptional, IsNumber, Min, Max } from "class-validator";
import { NumberOptional, StringOptional } from "src/decorators/dto.decorator";

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Type(() => Number)
  @Min(0.5)
  @Max(5)
  rating: number;
  
  @StringOptional()
  comment?: string;
}