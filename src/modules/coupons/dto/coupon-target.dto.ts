import { IsEnum, IsOptional, IsNumber } from "class-validator";
import { TargetType } from "src/constants/target-type.enum";
import { NumberOptional } from "src/decorators/dto.decorator";

export class CouponTargetDto {
  @IsEnum(TargetType)
  targetType: TargetType;

  @NumberOptional()
  targetId?: number;
}