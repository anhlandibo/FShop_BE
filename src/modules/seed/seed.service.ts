import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Transaction } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { brandSeed, categorySeed, productImageSeed, productSeed, productVariantSeed, userSeed } from './data';
import { User } from '../users/entities/user.entity';
import { hashPassword } from 'src/utils/hash';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductImage } from '../products/entities/product-image.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async run(){
    await this.dataSource.transaction(async (manager) => {
      // Use manager instead of repositories directly
      await manager.getRepository(Brand).save(brandSeed);
      await manager.getRepository(Category).save(categorySeed);
      const usersWithHashed = await Promise.all(
        userSeed.map(async user => {
          return {
            ...user,
            password: await hashPassword(user.password ?? "123456"),
          };
        }),
      );
      await manager.getRepository(User).save(usersWithHashed);
      await manager.getRepository(Product).save(productSeed);
      await manager.getRepository(ProductVariant).save(productVariantSeed);
      await manager.getRepository(ProductImage).save(productImageSeed);
    });
  }
}
