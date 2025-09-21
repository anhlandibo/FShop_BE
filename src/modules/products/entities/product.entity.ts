import { Brand } from "src/modules/brands/entities/brand.entity";
import { Category } from "src/modules/categories/entities/category.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProductVariant } from "./product-variant.entity";
import { ProductImage } from "./product-image.entity";
import { Exclude } from "class-transformer";
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products)
  brand: Brand;

  @OneToMany(() => ProductVariant, productVariant => productVariant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, productImage => productImage.product)
  images: ProductImage[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}