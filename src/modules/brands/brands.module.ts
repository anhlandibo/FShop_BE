import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  controllers: [BrandsController],
  exports: [BrandsService],
  imports: [TypeOrmModule.forFeature([Brand]), CloudinaryModule],
  providers: [BrandsService],
})
export class BrandsModule {}
