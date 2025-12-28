import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class DeleteDepartmentsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true }) 
    @Type(() => Number)  
    ids: number[];
}