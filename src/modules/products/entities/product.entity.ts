import { Brand } from "src/modules/brands/entities/brand.entity";
import { Category } from "src/modules/categories/entities/category.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProductVariant } from "./product-variant.entity";
import { ProductImage } from "./product-image.entity";
import { Exclude } from "class-transformer";
import { Wishlist } from "src/modules/wishlists/entities/wishlist.entity";
import { Review } from "src/modules/reviews/entities/review.entity";
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2})
  price: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

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

  @OneToMany(() => Wishlist, wishlist => wishlist.product)
  wishlist: Wishlist[];
}