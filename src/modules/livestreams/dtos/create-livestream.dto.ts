import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateLivestreamDto {
  @IsString()
  @IsNotEmpty({ message: 'Title can not be empty' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(v => parseInt(String(v), 10)) : [];
      } catch {
        return [];
      }
    }
    // Already an array
    if (Array.isArray(value)) {
      return value.map(v => parseInt(String(v), 10));
    }
    return [];
  })
  productIds?: number[];

  @IsDateString()
  @IsOptional()
  scheduledAt?: Date;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}