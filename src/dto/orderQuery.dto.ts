import { IsOptional, IsIn } from "class-validator";
import { OrderStatus } from "src/constants";
import { QueryDto } from "./query.dto";

export class OrderQueryDto extends QueryDto {
  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  status?: OrderStatus;
}