/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Transaction } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { User } from '../users/entities/user.entity';
import { hashPassword } from 'src/utils/hash';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { Department } from '../departments/entities/department.entity';
import { AttributeCategory } from '../attributes/entities/attribute-category.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { attributeSeed, attributeCategorySeed } from './data/attribute.data';
import { brandSeed } from './data/brand.data';
import { categorySeed } from './data/category.data';
import { departmentSeed } from './data/department.data';
import { productSeed } from './data/product.data';
import { productImageSeed } from './data/product-image.data';
import { VariantAttributeValue } from '../products/entities/variant-attribute-value.entity';
import { variantAttributeValueSeed } from './data/variant-attribute-value.seed';
import { productVariantSeed } from './data/variant.data';

@Injectable()
export class SeedService {
  logger: any;
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async run() {
    await this.dataSource.transaction(async (manager) => {
      // Use manager instead of repositories directly

      /** ---------- DEPARTMENTS ---------- */
      const departmentRepo = manager.getRepository(Department);
      const departmentEntities = departmentSeed.map((item) =>
        departmentRepo.create(item),
      );
      await departmentRepo.save(departmentEntities);
      const deptMap = new Map(departmentEntities.map((d) => [d.name, d.id]));

      /** ---------- BRANDS ---------- */
      const brandRepo = manager.getRepository(Brand);
      const brandEntities = brandSeed.map((b) => brandRepo.create(b));
      await brandRepo.save(brandEntities);
      const brandMap = new Map(brandEntities.map((b) => [b.name, b.id]));

      /** ---------- CATEGORIES ---------- */
      const categoryRepo = manager.getRepository(Category);
      const categoryEntities = categorySeed.map((item) => {
        const deptId = deptMap.get(item.departmentKey);
        if (!deptId)
          throw new Error(`Department not found: ${item.departmentKey}`);
        return categoryRepo.create({
          name: item.name,
          imageUrl: item.imageUrl,
          publicId: item.publicId,
          description: item.description,
          isActive: true,
          department: { id: deptId } as any,
        });
      });
      await categoryRepo.save(categoryEntities);
      const catMap = new Map(categoryEntities.map((c) => [c.name, c.id]));

      /** ---------- ATTRIBUTES ---------- */
      const attributeRepo = manager.getRepository(Attribute);
      const attributeEntities = attributeRepo.create(attributeSeed);
      await attributeRepo.save(attributeEntities);
      const attrMap = new Map(attributeEntities.map((a) => [a.name, a.id]));

      /** ---------- ATTRIBUTE-CATEGORY ---------- */
      const attrCatRepo = manager.getRepository(AttributeCategory);

      const attrCatEntities = attributeCategorySeed.flatMap((seed) => {
        const attrId = attrMap.get(seed.attributeKey);
        const catId = catMap.get(seed.categoryKey);
        if (!attrId || !catId) {
          return [];
        }

        return (seed.value ?? '').split(',').map((v) =>
          attrCatRepo.create({
            value: v.trim(),
            attribute: { id: attrId } as any,
            category: { id: catId } as any,
          }),
        );
      });

      await attrCatRepo.save(attrCatEntities);

      const productRepo = manager.getRepository(Product);
      const productEntities = productSeed.map((item) => {
        // Lấy categoryId và brandId từ map đã tạo ở trên
        const categoryName = item.category?.name;
        const brandName = item.brand?.name;

        if (!categoryName) {
          throw new Error(
            `Seed data for product "${item.name}" is missing a category name.`,
          );
        }
        if (!brandName) {
          throw new Error(
            `Seed data for product "${item.name}" is missing a brand name.`,
          );
        }

        const categoryId = catMap.get(categoryName);
        const brandId = brandMap.get(brandName);

        // Các bước kiểm tra phía sau giữ nguyên
        if (!categoryId) {
          throw new Error(
            `Category "${categoryName}" not found for product: ${item.name}`,
          );
        }
        if (!brandId) {
          throw new Error(
            `Brand "${brandName}" not found for product: ${item.name}`,
          );
        }

        return productRepo.create({
          name: item.name,
          description: item.description,
          price: item.price,
          category: { id: categoryId } as any,
          brand: { id: brandId } as any,
          isActive: true, // Mặc định là active
        });
      });

      // Lưu tất cả product vào DB, lúc này các product sẽ có ID
      await productRepo.save(productEntities);

      /** ---------- PRODUCT IMAGES ---------- */
      const productImageRepo = manager.getRepository(ProductImage);
      const productImageEntities = productImageSeed.map((item) => {
        if (!item.product?.id)
          throw new HttpException('Product ID is missing', 400);
        const productIndex = item.product.id - 1;
        const targetProduct = productEntities[productIndex];

        if (!targetProduct) {
          throw new Error(
            `Product with seeded ID ${item.product.id} not found.`,
          );
        }

        return productImageRepo.create({
          publicId: item.publicId,
          // Bạn có thể để imageUrl trống hoặc điền URL thực tế nếu có
          imageUrl:
            item.imageUrl ||
            `https://placeholder.com/image-for-${item.publicId}`,
          isActive: item.isActive,
          product: targetProduct, // Gán toàn bộ object product đã được lưu
        });
      });

      await productImageRepo.save(productImageEntities);

      /** ---------- PRODUCT VARIANTS ---------- */
      const productVariantRepo = manager.getRepository(ProductVariant);
      const variantEntities = productVariantSeed.map((variant) => {
        const targetProduct = productEntities[(variant.product?.id ?? 0) - 1];
        if (!targetProduct)
          throw new Error(
            `Product with seeded ID ${variant.product?.id} not found for variant ${variant.publicId}`,
          );

        return productVariantRepo.create({
          publicId: variant.publicId,
          imageUrl: variant.imageUrl || '',
          quantity: variant.quantity,
          remaining: variant.remaining,
          isActive: variant.isActive,
          product: targetProduct,
        });
      });
      await productVariantRepo.save(variantEntities);

      /** ---------- VARIANT ATTRIBUTE VALUES ---------- */
      const vavRepo = manager.getRepository(VariantAttributeValue);

      // ✅ Load lại tất cả AttributeCategory cùng quan hệ category + attribute
      const attrCatAll = await manager.getRepository(AttributeCategory).find({
        relations: ['category', 'attribute'],
      });

      // 🔹 Tạo Map để lookup nhanh
      const attrCatMap = new Map<string, number>();
      for (const ac of attrCatAll) {
        const key = `${ac.category.name}-${ac.attribute.name}-${ac.value}`;
        attrCatMap.set(key, ac.id);
      }

      // 🔹 Type tạm cho seed meta
      type AttributeCategorySeedMeta = {
        categoryKey: string;
        attributeKey: string;
        value: string;
      };

      const vavEntities = variantAttributeValueSeed.map((vav) => {
        const variantTarget =
          variantEntities[(vav.productVariant?.id ?? 0) - 1];
        if (!variantTarget)
          throw new Error(
            `Variant with seeded ID ${vav.productVariant?.id} not found for VAV.`,
          );

        const meta =
          vav.attributeCategory as unknown as AttributeCategorySeedMeta;
        const key = `${meta.categoryKey}-${meta.attributeKey}-${meta.value}`;
        const attrCatId = attrCatMap.get(key);
        if (!attrCatId)
          throw new Error(`AttributeCategory not found for key: ${key}`);

        return vavRepo.create({
          productVariant: variantTarget,
          attributeCategory: { id: attrCatId } as any,
        });
      });

      await vavRepo.save(vavEntities);
      console.log('✅ Seeding completed successfully!');
    });
  }
}
