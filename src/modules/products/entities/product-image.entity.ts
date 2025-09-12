import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { Exclude } from 'class-transformer';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  publicId: string;

  @ManyToOne(() => Product, (product) => product.images)
  @Exclude()
  product: Product;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}