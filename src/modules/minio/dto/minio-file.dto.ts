import { ApiProperty } from '@nestjs/swagger';

export class MinioFileDto {
  @ApiProperty()
  fileName: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  etag: string;

  @ApiProperty()
  lastModified: Date;

  @ApiProperty({ required: false })
  url?: string;
}
