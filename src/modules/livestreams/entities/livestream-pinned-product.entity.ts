import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Livestream } from './livestream.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('livestream_pinned_products')
export class LivestreamPinnedProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Livestream)
  livestream: Livestream;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ type: 'int', default: 0 })
  addToCartCount: number;

  @Column({ type: 'timestamp' })
  pinnedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  unpinnedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
