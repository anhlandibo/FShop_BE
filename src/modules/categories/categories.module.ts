import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Department } from '../departments/entities/department.entity';
import { AttributesModule } from '../attributes/attributes.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
  imports: [TypeOrmModule.forFeature([Category, Department]), CloudinaryModule, AttributesModule]
})
export class CategoriesModule {}
