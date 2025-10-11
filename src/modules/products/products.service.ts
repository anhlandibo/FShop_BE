/* eslint-disable @typescript-eslint/no-unsafe-return */
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, DataSource, Like } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { plainToInstance } from 'class-transformer';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { AttributeCategory } from '../attributes/entities/attribute-category.entity';
import { ProductQueryDto } from 'src/dto/productQuery.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant) private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage) private productImageRepository: Repository<ProductImage>,
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(
    createProductDto: CreateProductDto,
    images: Array<Express.Multer.File>,
    variantImages: Array<Express.Multer.File>
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // Check trùng tên
      if (await manager.findOne(Product, { where: { name: createProductDto.name } }))
        throw new HttpException('Product name already exist', HttpStatus.CONFLICT);

      // Check brand
      const existingBrand = await manager.findOne(Brand, { where: { id: createProductDto.brandId } });
      if (!existingBrand) throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);

      // Check category
      const existingCategory = await manager.findOne(Category, { where: { id: createProductDto.categoryId } });
      if (!existingCategory) throw new HttpException('Category not found', HttpStatus.NOT_FOUND)

      // Tạo product
      const newProduct = manager.create(Product, {
        ...createProductDto,
        brand: existingBrand,
        category: existingCategory,
      });
      const savedProduct = await manager.save(newProduct);

      // Variants + Images
      const variants: ProductVariant[] = [];
      if (createProductDto.variants && createProductDto.variants.length > 0) {
        for (let i = 0; i < createProductDto.variants.length; i++) {
          const variantDto = createProductDto.variants[i];
          let imageUrl: string | undefined = undefined;
          let publicId: string | undefined = undefined;

          if (variantImages[i]) {
            const uploaded = await this.cloudinaryService.uploadFile(
              variantImages[i],
            );
            imageUrl = uploaded?.secure_url;
            publicId = uploaded?.public_id;
          }

          const variant = manager.create(ProductVariant, {
            ...variantDto,
            remaining: variantDto.quantity,
            product: savedProduct,
            imageUrl,
            publicId,
          });
          const savedVariant = await manager.save(variant);

          // Tạo attribute cho variant
          const attributeValues: VariantAttributeValue[] = [];
          if (variantDto.attributes && variantDto.attributes.length > 0) {
            for (const attr of variantDto.attributes) {
              const attributeCategory = await manager.findOne(AttributeCategory, {
                where: { id: attr.attributeCategoryId }
              });

              if (!attributeCategory)
                throw new HttpException('Attribute category not found', HttpStatus.NOT_FOUND);

              const variantAttributeValue = manager.create(VariantAttributeValue, {
                productVariant: savedVariant,
                attributeCategory,
              });
              attributeValues.push(variantAttributeValue);
            }
            await manager.save(attributeValues);
            savedVariant.variantAttributeValues = attributeValues;
          }
          variants.push(savedVariant);
        }
      }
      else {
        const defaultVariant = manager.create(ProductVariant, { product: savedProduct });
        variants.push(await manager.save(defaultVariant));
      }
      // await manager.save(variants);

      // Product images
      const uploads = await Promise.all(images.map((image) => this.cloudinaryService.uploadFile(image)));

      const productImages = uploads.map((uploaded) =>
        manager.create(ProductImage, {
          imageUrl: uploaded?.secure_url,
          publicId: uploaded?.public_id,
          product: savedProduct,
        }),
      );
      await manager.save(productImages);

      return plainToInstance(Product, {
        ...savedProduct,
        variants,
        images: productImages,
      });
    });
  }

  async findAll(query: ProductQueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC', categoryId, attributeCategoryIds, minPrice, maxPrice } = query;
    const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variant')
        .leftJoinAndSelect('product.images', 'image')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoin('category.attributeCategories', 'attributeCategory');
        if (search) {
        queryBuilder.andWhere('(product.name LIKE :search OR product.description LIKE :search)', {
          search: `%${search}%`,
        });
      }

      if (categoryId) queryBuilder.andWhere('category.id = :categoryId', { categoryId });
      

      if (attributeCategoryIds?.length)
        queryBuilder.andWhere('attributeCategory.id IN (:...attributeCategoryIds)', {attributeCategoryIds});

      if (minPrice) queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
      if (maxPrice) queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });

      queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

      if (page && limit) {
        queryBuilder.skip((page - 1) * limit).take(limit);
      }

      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        pagination: { total, page, limit },
        data,
      };
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'variants',
        'variants.variantAttributeValues',
        'variants.variantAttributeValues.attributeCategory',
        'variants.variantAttributeValues.attributeCategory.attribute',
        'images',
        'brand',
        'category',
      ],
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  /* async delete(id: number) {
    const product = await this.productRepository.findOne({where: { id }});
    if (!product || product.isActive === false) 
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    await this.productRepository.update(id, { isActive: false });
    await this.productVariantRepository.update(
      { product: { id } },
      { isActive: false },
    );
    await this.productImageRepository.update(
      { product: { id } },
      { isActive: false },
    );

    return {
      message: 'Product deleted successfully',
      deleteId: id,
    };
  } */
}
function In(attributeCategoryIds: number[] | undefined): number | import("typeorm").FindOperator<number> | undefined {
  throw new Error('Function not implemented.');
}

