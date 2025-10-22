/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { UpdateProductDto } from './dto/update-product.dto';

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

  async update(
    id: number, 
    dto: UpdateProductDto, 
    newVariantImages: Express.Multer.File[],
    updatedVariantImages: Express.Multer.File[],
    newProductImages: Express.Multer.File[],
    updateProductImages: Express.Multer.File[],
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: ['variants', 'brand', 'category', 'images'],
      })

      if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

      // Update basic fields
      if (dto.name !== undefined) product.name = dto.name;
      if (dto.description !== undefined) product.description = dto.description;
      if (dto.price !== undefined) product.price = dto.price;

      if (dto.brandId !== undefined) {
        const brand = await manager.findOne(Brand, { where: { id: dto.brandId } });
        if (!brand) throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
        product.brand = brand;
      }

      if (dto.categoryId !== undefined) {
        const category = await manager.findOne(Category, { where: { id: dto.categoryId } });
        if (!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
        product.category = category;
      }

      await manager.save(product);

      // variants
      // add variants
      if (dto.newVariants?.length) {
        for (let i = 0; i < dto.newVariants.length; i++) {
          const v = dto.newVariants[i];
          let uploaded;
          if (newVariantImages?.[i])
            uploaded = await this.cloudinaryService.uploadFile(newVariantImages[i]);
          const created = manager.create(ProductVariant, {
            product,
            quantity: v.quantity,
            remaining: v.quantity,
            imageUrl: uploaded?.secure_url,
            publicId: uploaded?.public_id,
            isActive: true
          })
          const saved = await manager.save(created);
          if (v.attributes?.length) {
            const vavs: VariantAttributeValue[] = [];
            for (const a of v.attributes) {
              const ac = await manager.findOne(AttributeCategory, { where: { id: a.attributeCategoryId } });
              if (!ac) throw new HttpException('Attribute category not found', HttpStatus.NOT_FOUND);
              vavs.push(manager.create(VariantAttributeValue, {productVariant: saved, attributeCategory: ac}));
            }
            await manager.save(vavs);
          }
        }
      }

      // update variants
      if (dto.updatedVariants?.length) {
        for (let i = 0; i < dto.updatedVariants.length; i++) {
          const v = dto.updatedVariants[i];
          const variant = await manager.findOne(ProductVariant, {
            where: {id: v.id, product: {id: product.id}},
            relations: ['variantAttributeValues']
          })
          if (!variant) throw new HttpException(`Variant ${v.id} not found`, HttpStatus.NOT_FOUND);
          if (v.quantity !== undefined){
            variant.quantity = v.quantity;
            variant.remaining = v.quantity; // temporary 
          }

          if (updatedVariantImages?.[i]) {
            if (variant.publicId) {
              try {await this.cloudinaryService.deleteFile(variant.publicId)} 
              catch { /* empty */ }
            }
            const up = await this.cloudinaryService.uploadFile(updatedVariantImages[i]);
            variant.imageUrl = up?.secure_url;
            variant.publicId = up?.public_id;
          }
          await manager.save(variant);

          // replace attributes
          if (v.attributes){
            await manager.delete(VariantAttributeValue, {productVariant: {id: v.id}});
            const vavs: VariantAttributeValue[] = [];
            for (const a of v.attributes) {
              const ac = await manager.findOne(AttributeCategory, { where: { id: a.attributeCategoryId } });
              if (!ac) throw new HttpException(`AttributeCategory not found`, HttpStatus.NOT_FOUND);
              vavs.push(manager.create(VariantAttributeValue, { productVariant: variant, attributeCategory: ac }));
            }
            await manager.save(vavs);
          }
        }
      }

      // 5) Delete variants
      if (dto.deletedVariantIds?.length) {
        const toDel = await manager.find(ProductVariant, { where: dto.deletedVariantIds.map((id) => ({ id })) });
        for (const v of toDel) {
          if (v.publicId) {
            try { await this.cloudinaryService.deleteFile(v.publicId); } 
            catch { /* empty */ }
          }
          v.isActive = false;
        }
        
        await manager.save(toDel);
      }

      // 6) Add new product images
      if (newProductImages?.length) {
        const uploads = await Promise.all(newProductImages.map((f) => this.cloudinaryService.uploadFile(f)));
        const imgs = uploads.map((u) =>
          manager.create(ProductImage, {
            product,
            imageUrl: u?.secure_url,
            publicId: u?.public_id,
            isActive: true,
          }),
        );
        await manager.save(imgs);
      }

      // 7) Replace existing product images by id (ids & files theo cùng index)
      if (dto.updatedProductIds?.length) {
        if (!updateProductImages?.length || updateProductImages.length !== dto.updatedProductIds.length) {
          throw new HttpException('updatedProductIds length must match updateProductImages length', HttpStatus.BAD_REQUEST);
        }

        for (let i = 0; i < dto.updatedProductIds.length; i++) {
          const imgId = dto.updatedProductIds[i];
          const file = updateProductImages[i];
          const img = await manager.findOne(ProductImage, { where: { id: imgId, product: { id: product.id } } });
          if (!img) throw new HttpException(`Product image ${imgId} not found`, HttpStatus.NOT_FOUND);

          if (img.publicId) {
            try { await this.cloudinaryService.deleteFile(img.publicId); } catch { /* empty */ }
          }
          const up = await this.cloudinaryService.uploadFile(file);
          img.imageUrl = up?.secure_url;
          img.publicId = up?.public_id;
          img.isActive = true;
          await manager.save(img);
        }
      }

      // 8) Delete product images by id
      if (dto.deletedProductIds?.length) {
        const imgs = await manager.find(ProductImage, { where: dto.deletedProductIds.map((id) => ({ id, product: { id: product.id } })) });
        for (const img of imgs) {
          if (img.publicId) {
            try { await this.cloudinaryService.deleteFile(img.publicId); } catch { /* empty */ }
          }
          img.isActive = false;
        }
        await manager.save(imgs);
      }

      // 9) Return fully-hydrated product
      return this.getProductById(product.id);

    })
  }
}

function In(attributeCategoryIds: number[] | undefined): number | import("typeorm").FindOperator<number> | undefined {
  throw new Error('Function not implemented.');
}

