import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class DeleteCategoriesDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true }) // mỗi phần tử trong mảng phải là số nguyên
    @Type(() => Number)    // ép kiểu từng phần tử thành number
    ids: number[];
}