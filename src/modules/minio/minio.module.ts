import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioProvider } from './minio.provider';

@Module({
  providers: [MinioProvider, MinioService],
  exports: [MinioProvider, MinioService],
})
export class MinioModule {}
