import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BrandsModule } from '../brands/brands.module';
import { CategoriesModule } from '../categories/categories.module';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, ProductImage, Brand, Category]), CloudinaryModule, BrandsModule, CategoriesModule]
})
export class ProductsModule {}
