/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { plainToInstance, Transform, Type } from "class-transformer";
import { IsOptional, IsArray, ValidateNested } from "class-validator";
import { NumberRequired, StringOptional, StringRequired } from "src/decorators/dto.decorator";
import { CreateAttributeValueDto } from "src/modules/attributes/dto/create-attribute-value.dto";

export class CreateCategoryDto {
  @StringRequired('Category name')
  name: string;

  @NumberRequired('Department id')
  departmentId: number;

  @StringOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map((v: any) =>
          plainToInstance(CreateAttributeValueDto, v),
        );
      } catch (err) {
        console.error('JSON parse error for variants:', err);
        return [];
      }
    }
    return value;
  })
  @Type(() => CreateAttributeValueDto)
  attributes?: CreateAttributeValueDto[];
}
