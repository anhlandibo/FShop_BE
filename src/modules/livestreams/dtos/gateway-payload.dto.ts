import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

// DTO join room
export class JoinStreamDto {
  @IsNumber()
  @IsNotEmpty()
  livestreamId: number;

  @IsString()
  @IsOptional()
  guestId?: string;
}

// DTO cho user chat
export class SendMessageDto {
  @IsNumber()
  @IsNotEmpty()
  livestreamId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}

// DTO cho admin ghim hàng
export class PinProductDto {
  @IsNumber()
  @IsNotEmpty()
  livestreamId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}

// DTO cho unpin product
export class UnpinProductDto {
  @IsNumber()
  @IsNotEmpty()
  livestreamId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}

// DTO cho track product click
export class TrackProductClickDto {
  @IsNumber()
  @IsNotEmpty()
  livestreamId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}

// DTO cho leave stream
export class LeaveStreamDto {
  @IsNumber()
  @IsNotEmpty()
  livestreamId: number;
}