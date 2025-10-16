import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [TypeOrmModule.forFeature([Category, Brand, Department])],
})
export class SeedModule {}
