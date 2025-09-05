import { Type } from 'class-transformer';
import { IsOptional, IsNumberString, IsString, IsNumber, IsIn } from 'class-validator';

export class QueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}
