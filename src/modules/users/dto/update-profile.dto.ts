import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { StringOptional } from 'src/decorators/dto.decorator';

export class UpdateProfileDto {
  @StringOptional()
  fullName?: string;
}