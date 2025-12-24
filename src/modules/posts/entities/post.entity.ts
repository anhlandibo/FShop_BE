import { User } from 'src/modules/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostImage } from './post-image.entity';
import { PostProduct } from './post-product.entity';
import { PostLike } from './post-like.entity';
import { PostComment } from './post-comment.entity';
import { PostBookmark } from './post-bookmark.entity';
import { PostShare } from './post-share.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Column({ type: 'int', default: 0 })
  totalLikes: number;

  @Column({ type: 'int', default: 0 })
  totalComments: number;

  @Column({ type: 'int', default: 0 })
  totalShares: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PostImage, (image) => image.post, { cascade: true })
  images: PostImage[];

  @OneToMany(() => PostProduct, (postProduct) => postProduct.post, { cascade: true })
  postProducts: PostProduct[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @OneToMany(() => PostBookmark, (bookmark) => bookmark.post)
  bookmarks: PostBookmark[];

  @OneToMany(() => PostShare, (share) => share.post)
  shares: PostShare[];
}
