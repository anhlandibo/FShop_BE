// src/modules/auth/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
}