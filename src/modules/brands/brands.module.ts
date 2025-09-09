import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';

@Module({
  controllers: [BrandsController],
  exports: [BrandsService],
  imports: [TypeOrmModule.forFeature([Brand])],
  providers: [BrandsService],
})
export class BrandsModule {}
