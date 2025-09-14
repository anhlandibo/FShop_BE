import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  IsBoolean,
  IsPhoneNumber,
} from 'class-validator';

export const StringOptional = () =>
  applyDecorators(ApiProperty({ required: false }), IsString(), IsOptional());

export const StringRequired = (name: string) =>
  applyDecorators(
    ApiProperty({
      required: true,
    }),
    IsString({ message: `${name} must be a string` }),
    IsNotEmpty({ message: `${name} can not be empty` }),
  );

export const NumberOptional = () =>
  applyDecorators(
    ApiProperty({ required: false }),
    IsOptional(),
    Type(() => Number),
    IsNumber(),
  );

export const NumberRequired = (name: string, min: number = 0, max?: number) =>
  applyDecorators(
    ApiProperty({ required: true }),
    Type(() => Number),
    IsNotEmpty({ message: `${name} can not be empty` }),
    IsNumber(),
    Min(min),
    ...(max ? [Max(max)] : []),
  );

export const BooleanOptional = () =>
  applyDecorators(
    ApiProperty({ required: false }),
    IsOptional(),
    IsBoolean(),
    Transform(({ value }) => value === 'true' || value === '1' || value === true),
  );

export const PhoneNumberRequired = (name: string) =>
  applyDecorators(
    ApiProperty({
      required: true,
      example: '+841234567890',
      description: 'Phone number must be a valid number with country code.',
    }),
    IsString({ message: `${name} must be a string` }),
    IsNotEmpty({ message: `${name} can not be empty` }),
    IsPhoneNumber('VN', {
      message: 'Invalid phone number format',
    }),
  );

export const PhoneNumberOptional = (name: string) =>
  applyDecorators(
    ApiProperty({
      required: false,
      example: '+84987654321',
      description: 'The phone number must be a valid number with country code.',
    }),
    IsOptional(),
    IsString({ message: `${name} must be a string` }),
    IsPhoneNumber('VN', {
      message: 'Invalid phone number format',
    }),
  );
