import { Exclude } from 'class-transformer';
import { Product } from 'src/modules/products/entities';
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_products')
export class PostProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.postProducts, { onDelete: 'CASCADE' })
  @Exclude()
  post: Post;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
