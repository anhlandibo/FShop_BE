import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Exclude } from 'class-transformer';
import { CartItem } from 'src/modules/carts/entities/cart-item.entity';
import { OrderItem } from 'src/modules/orders/entities';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  publicId: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  remaining: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.variants)
  @Exclude()
  product: Product;

  @OneToMany(() => CartItem, (cartItem) => cartItem.variant)
  cartItems: CartItem[];

  @OneToMany(() => OrderItem, orderItem => orderItem.variant)
  orderItems: OrderItem[];
}
