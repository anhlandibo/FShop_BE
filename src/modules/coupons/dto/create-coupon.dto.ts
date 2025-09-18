import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsOptional, Min, ValidateNested } from "class-validator";
import { CouponStatus, DiscountType } from "src/constants";
import { NumberOptional, StringOptional, StringRequired } from "src/decorators/dto.decorator";
import { CouponTargetDto } from "./coupon-target.dto";

export class CreateCouponDto {
  @StringRequired('Coupone Code')
  code: string;

  @StringOptional()
  name?: string;

  @StringOptional()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType

  @NumberOptional()
  @Min(0)
  discountValue?: number;

  @NumberOptional()
  @Min(0)
  minOrderAmount?: number;

  @NumberOptional()
  @Min(0)
  usageLimit?: number;

  @NumberOptional()
  @Min(0)
  usageLimitPerUser?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouponTargetDto)
  targets?: CouponTargetDto[];
}