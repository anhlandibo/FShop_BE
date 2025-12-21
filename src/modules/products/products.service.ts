/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, DataSource, Like, In } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { plainToInstance } from 'class-transformer';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { AttributeCategory } from '../attributes/entities/attribute-category.entity';
import { ProductQueryDto } from 'src/dto/productQuery.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { ProductVariantQueryDto } from './dto/variant-query.dto';
import { OrderStatus } from 'src/constants';
import { Order } from '../orders/entities';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    images: Array<Express.Multer.File>,
    variantImages: Array<Express.Multer.File>,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // Check trùng tên
      if (
        await manager.findOne(Product, {
          where: { name: createProductDto.name },
        })
      )
        throw new HttpException(
          'Product name already exist',
          HttpStatus.CONFLICT,
        );

      // Check brand
      const existingBrand = await manager.findOne(Brand, {
        where: { id: createProductDto.brandId },
      });
      if (!existingBrand)
        throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);

      // Check category
      const existingCategory = await manager.findOne(Category, {
        where: { id: createProductDto.categoryId },
      });
      if (!existingCategory)
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

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
              const attributeCategory = await manager.findOne(
                AttributeCategory,
                {
                  where: { id: attr.attributeCategoryId },
                },
              );

              if (!attributeCategory)
                throw new HttpException(
                  'Attribute category not found',
                  HttpStatus.NOT_FOUND,
                );

              const variantAttributeValue = manager.create(
                VariantAttributeValue,
                {
                  productVariant: savedVariant,
                  attributeCategory,
                },
              );
              attributeValues.push(variantAttributeValue);
            }
            await manager.save(attributeValues);
            savedVariant.variantAttributeValues = attributeValues;
          }
          variants.push(savedVariant);
        }
      } else {
        const defaultVariant = manager.create(ProductVariant, {
          product: savedProduct,
        });
        variants.push(await manager.save(defaultVariant));
      }
      // await manager.save(variants);

      // Product images
      const uploads = await Promise.all(
        images.map((image) => this.cloudinaryService.uploadFile(image)),
      );

      const productImages = uploads.map((uploaded) =>
        manager.create(ProductImage, {
          imageUrl: uploaded?.secure_url,
          publicId: uploaded?.public_id,
          product: savedProduct,
        }),
      );
      const savedImages = await manager.save(productImages);

      for (const img of savedImages)
        if (img.imageUrl)
          this.syncImageToVectorDB(img.id, savedProduct.id, img.imageUrl);

      return plainToInstance(Product, {
        ...savedProduct,
        variants,
        images: savedImages,
      });
    });
  }

  async findAll(query: ProductQueryDto) {
    const {
      page,
      limit,
      search,
      sortBy = 'id',
      sortOrder = 'DESC',
      categoryId,
      attributeCategoryIds,
      brandIds,
      minPrice,
      maxPrice,
    } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')

      // product
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')

      // variants
      .leftJoinAndSelect(
        'product.variants',
        'variant',
        'variant.isActive = :isActive',
        { isActive: true },
      )

      // 🔥 JOIN SÂU CHO VARIANT
      .leftJoinAndSelect(
        'variant.variantAttributeValues',
        'variantAttributeValue',
      )
      .leftJoinAndSelect(
        'variantAttributeValue.attributeCategory',
        'attributeCategory',
      )
      .leftJoinAndSelect('attributeCategory.attribute', 'attribute');

    // ================= FILTER =================

    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    if (brandIds?.length) {
      queryBuilder.andWhere('brand.id IN (:...brandIds)', { brandIds });
    }

    if (attributeCategoryIds?.length) {
      queryBuilder.andWhere(
        'attributeCategory.id IN (:...attributeCategoryIds)',
        { attributeCategoryIds },
      );
    }

    if (minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

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
    const product = await this.productRepository
      .createQueryBuilder('product')
      .where('product.id = :id', { id })

      .leftJoinAndSelect(
        'product.variants',
        'variant',
        'variant.isActive = :isActive',
        { isActive: true },
      )

      // 2. Join các bảng con của Variant
      .leftJoinAndSelect(
        'variant.variantAttributeValues',
        'variantAttributeValues',
      )
      .leftJoinAndSelect(
        'variantAttributeValues.attributeCategory',
        'attributeCategory',
      )
      .leftJoinAndSelect('attributeCategory.attribute', 'attribute')

      // 3. Join Images: Cũng nên filter isActive = true (nếu bạn có logic soft delete ảnh)
      .leftJoinAndSelect(
        'product.images',
        'image',
        'image.isActive = :isActive',
        { isActive: true },
      )

      // 4. Các thông tin khác
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .getOne();

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    variantImages: Express.Multer.File[],
    newProductImages: Express.Multer.File[],
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: ['variants', 'brand', 'category', 'images'],
      });

      if (!product)
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

      // Update basic fields
      if (dto.name !== undefined) product.name = dto.name;
      if (dto.description !== undefined) product.description = dto.description;
      if (dto.price !== undefined) product.price = dto.price;

      if (dto.brandId !== undefined) {
        const brand = await manager.findOne(Brand, {
          where: { id: dto.brandId },
        });
        if (!brand)
          throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
        product.brand = brand;
      }

      if (dto.categoryId !== undefined) {
        const category = await manager.findOne(Category, {
          where: { id: dto.categoryId },
        });
        if (!category)
          throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
        product.category = category;
      }

      await manager.save(product);
      if (newProductImages.length > 0 || (dto as any).deleteOldImages) {
        const imageIdsToDelete: number[] = [];

        for (const img of product.images) {
          if (img.publicId)
            await this.cloudinaryService
              .deleteFile(img.publicId)
              .catch(() => {});

          imageIdsToDelete.push(img.id);
        }

        for (const img of product.images) {
          if (img.publicId)
            await this.cloudinaryService
              .deleteFile(img.publicId)
              .catch(() => {});
        }
        await manager.remove(ProductImage, product.images);

        // XÓA TRONG VECTOR DB
        this.removeImagesFromVectorDB(imageIdsToDelete);

        // Upload & Tạo mới
        const prodImgEntities: ProductImage[] = [];
        for (const file of newProductImages) {
          const up = await this.cloudinaryService.uploadFile(file);
          if (up) {
            prodImgEntities.push(
              manager.create(ProductImage, {
                product,
                imageUrl: up.secure_url,
                publicId: up.public_id,
                isActive: true,
              }),
            );
          }
        }
        const savedNewImages = await manager.save(prodImgEntities);

        for (const img of savedNewImages)
          this.syncImageToVectorDB(img.id, product.id, img.imageUrl);
      }

      if (dto.variants && dto.variants.length > 0) {
        const currentVariants = product.variants;
        const incomingIds = dto.variants
          .map((v) => v.id)
          .filter((id): id is number => typeof id === 'number');

        // A. SOFT DELETE variants không còn trong list
        const toDeactivate = currentVariants.filter(
          (v) => !incomingIds.includes(v.id),
        );
        for (const v of toDeactivate) v.isActive = false;
        await manager.save(toDeactivate);

        // B. LOOP variants (Khớp index i giữa JSON variants và mảng variantImages)
        for (let i = 0; i < dto.variants.length; i++) {
          const vDto = dto.variants[i];
          const imageFile = variantImages[i];

          let variantEntity: ProductVariant | undefined;

          // --- B1: Tìm hoặc Tạo ---
          if (vDto.id) {
            variantEntity = currentVariants.find((v) => v.id === vDto.id);
          }

          // Nếu không tìm thấy (hoặc là tạo mới) thì khởi tạo mới
          if (!variantEntity) {
            variantEntity = manager.create(ProductVariant, {
              product: product,
            });
          }

          // --- B2: Reset Attributes ---
          if (variantEntity.id) {
            await manager.delete(VariantAttributeValue, {
              productVariant: { id: variantEntity.id },
            });
          }

          // Tạo attribute mới
          if (vDto.attributes && vDto.attributes.length > 0) {
            const newAttrs: VariantAttributeValue[] = [];

            for (const attr of vDto.attributes) {
              const ac = await manager.findOne(AttributeCategory, {
                where: { id: attr.attributeCategoryId },
              });
              if (ac) {
                newAttrs.push(
                  manager.create(VariantAttributeValue, {
                    productVariant: variantEntity,
                    attributeCategory: ac,
                  }),
                );
              }
            }
            variantEntity.variantAttributeValues = newAttrs;
          }

          // --- B3: Xử lý Ảnh ---
          if (imageFile) {
            if (variantEntity.publicId) {
              await this.cloudinaryService
                .deleteFile(variantEntity.publicId)
                .catch(() => {});
            }
            const up = await this.cloudinaryService.uploadFile(imageFile);

            variantEntity.imageUrl = up?.secure_url;
            variantEntity.publicId = up?.public_id;
          }

          // --- B4: Cập nhật thông tin ---
          variantEntity.quantity = vDto.quantity ?? 0;
          variantEntity.remaining = vDto.quantity ?? 0;
          variantEntity.isActive = true;

          // --- B5: Save Variant ---
          const savedVariant = await manager.save(variantEntity);

          // --- B6: Save Attributes ---
          if (variantEntity.variantAttributeValues) {
            const attrsToSave = variantEntity.variantAttributeValues.map(
              (av) => {
                av.productVariant = savedVariant;
                return av;
              },
            );
            await manager.save(attrsToSave);
          }
        }
      }

      return this.getProductById(product.id);
    });
  }

  async searchByImage(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname);

      const url = 'http://localhost:8000/search/image';

      const { data: aiResults } = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: { ...formData.getHeaders() },
        }),
      );

      if (!aiResults || aiResults.length === 0) return [];

      const productIds = aiResults.map((item: any) => item.product_id);

      const products = await this.productRepository.find({
        where: {
          id: In(productIds),
          isActive: true,
        },
        relations: ['brand', 'category', 'images'],
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          brand: { id: true, name: true },
          category: { id: true, name: true },
          images: { id: true, imageUrl: true },
        },
      });

      const sortedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p !== undefined);

      return sortedProducts;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      throw new HttpException(
        'Image search service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  syncImageToVectorDB(imageId: number, productId: number, imageUrl: string) {
    try {
      const payload = {
        image_id: imageId,
        product_id: productId,
        image_url: imageUrl,
      };
      this.httpService
        .post('http://localhost:8000/vectors/upsert', payload)
        .subscribe({
          error: (err) => console.error('Sync Vector Error:', err.message),
        });
    } catch (e) {
      console.error('Sync Vector Failed', e);
    }
  }

  removeImagesFromVectorDB(imageIds: number[]) {
    if (!imageIds.length) return;
    try {
      const payload = { image_ids: imageIds };
      this.httpService
        .post('http://localhost:8000/vectors/delete', payload)
        .subscribe({
          error: (err) => console.error('Delete Vector Error:', err.message),
        });
    } catch (e) {
      console.error('Delete Vector Failed', e);
    }
  }

  async getRelatedProducts(id: number) {
    const currentProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!currentProduct)
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    const relatedProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.category.id = :categoryId', {
        categoryId: currentProduct.category.id,
      })
      .andWhere('product.id != :id', { id })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect(
        'product.variants',
        'variant',
        'variant.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'product.images',
        'image',
        'image.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')
      .take(5)
      .getMany();

    return relatedProducts;
  }

  async findAllVariants(query: ProductVariantQueryDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC', 
      productId 
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productVariantRepository
      .createQueryBuilder('variant')
      .where('variant.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.variantAttributeValues', 'vav')
      .leftJoinAndSelect('vav.attributeCategory', 'ac')
      .leftJoinAndSelect('ac.attribute', 'attr')
      .select([
        'variant.id', 
        'variant.imageUrl', 
        'variant.quantity', 
        'variant.remaining', 
        'variant.createdAt',
        'variant.isActive',
        'product.id', 
        'product.name', 
        'product.price',
        'vav.id', 
        'ac.value', 
        'attr.name'
      ]);

    if (productId) queryBuilder.andWhere('product.id = :productId', { productId });
    
    if (search) queryBuilder.andWhere('product.name LIKE :search', { search: `%${search}%` });
    
    if (sortBy === 'price' || sortBy === 'name') queryBuilder.orderBy(`product.${sortBy}`, sortOrder);
    else queryBuilder.orderBy(`variant.${sortBy}`, sortOrder);
    
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  
  async getPersonalizedRecommendations(userId: number) {
    // 1. Lấy lịch sử đơn hàng ĐÃ GIAO
    // Quan trọng: Phải join sâu vào tận bảng 'images' của product
    const recentOrders = await this.dataSource.getRepository(Order).find({
      where: { 
        user: { id: userId }, 
        status: OrderStatus.DELIVERED 
      },
      relations: [
        'items', 
        'items.variant', 
        'items.variant.product', 
        'items.variant.product.images' // <--- SỬA QUAN TRỌNG: Lấy ảnh product để lấy ID
      ],
      order: { createdAt: 'DESC' },
      take: 20 
    });

    if (!recentOrders || recentOrders.length === 0) {
      // Fallback: Nếu user chưa mua gì, trả về sản phẩm mới nhất
      return this.productRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['images', 'brand', 'category']
      });
    }

    // 2. Trích xuất IMAGE ID (Số nguyên) để khớp với Vector DB
    const userInteractions: { image_id: number; days_ago: number }[] = [];
    const now = new Date();

    recentOrders.forEach((order) => {
      const diffTime = Math.abs(now.getTime() - order.createdAt.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      order.items.forEach((item) => {
        // Logic: User mua Variant -> Variant thuộc Product -> Product có nhiều ảnh (ProductImage)
        // Vector DB đang lưu vector của các ProductImage này.
        // Ta lấy ảnh đầu tiên (hoặc ảnh active) của Product để làm context.
        
        const product = item.variant?.product;
        if (product && product.images && product.images.length > 0) {
          // Tìm ảnh active đầu tiên
          const representativeImage = product.images.find(img => img.isActive) || product.images[0];
          
          if (representativeImage) {
            userInteractions.push({
              image_id: representativeImage.id, // <--- ĐÚNG: Dùng ID số nguyên từ DB
              days_ago: diffDays,
            });
          }
        }
      });
    });

    if (userInteractions.length === 0) return [];

    // 3. Gọi AI Service (Payload lúc này gửi image_id là số)
    try {
      const { data } = await firstValueFrom(
        this.httpService.post('http://localhost:8000/recommend/profile-based', {
          interactions: userInteractions 
        })
      );

      const suggestedProductIds: number[] = data.product_ids || [];
      if (suggestedProductIds.length === 0) return [];

      // 4. Fetch chi tiết sản phẩm gợi ý
      const products = await this.productRepository.find({
        where: { id: In(suggestedProductIds), isActive: true },
        relations: ['brand', 'category', 'images'],
        select: {
            id: true,
            name: true,
            price: true,
            description: true,
            brand: { id: true, name: true },
            category: { id: true, name: true },
            images: { id: true, imageUrl: true },
        },
      });

      // Sắp xếp lại theo thứ tự AI trả về
      return suggestedProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p !== undefined);

    } catch (error) {
      console.error('AI Recommendation Error:', error.message);
      return [];
    }
  }

  async searchByVoice(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname);

      const url = 'http://localhost:8000/search/voice';

      const { data: aiResults } = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: { ...formData.getHeaders() }
        })
      )

      if (!aiResults || !aiResults.products || aiResults.products.length === 0)
        return {
          text: aiResults?.transcribed_text || '',
          data: []
        }
      
      const productIds = aiResults.products.map((item: any) => item.product_id);

      const products = await this.productRepository.find({
        where: { id: In(productIds), isActive: true },
        relations: ['brand', 'category', 'images'],
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          brand: { id: true, name: true },
          category: { id: true, name: true },
          images: { id: true, imageUrl: true }
        }
      });

      const sortedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p !== undefined);

      return {
        text: aiResults.transcribed_text,
        data: sortedProducts,
      }
    }
    catch (error) {
      console.error('AI Voice Service Error:', error.message);
      throw new HttpException('Voice search service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
