import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_images')
export class PostImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  publicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.images, { onDelete: 'CASCADE' })
  @Exclude()
  post: Post;
}
