import { User } from 'src/modules/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { PostImage } from './post-image.entity';
import { PostProduct } from './post-product.entity';
import { PostLike } from './post-like.entity';
import { PostComment } from './post-comment.entity';
import { PostBookmark } from './post-bookmark.entity';
import { PostShare } from './post-share.entity';
import { PostReaction } from './post-reaction.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Column({ type: 'int', default: 0 })
  totalComments: number;

  @Column({ type: 'int', default: 0 })
  totalShares: number;

  @Column({ type: 'int', default: 0 })
  totalReactions: number;

  @Column({
    type: 'jsonb',
    default: { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
  })
  reactionCounts: {
    LIKE: number;
    LOVE: number;
    HAHA: number;
    WOW: number;
    SAD: number;
    ANGRY: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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

  @OneToMany(() => PostReaction, (reaction) => reaction.post)
  reactions: PostReaction[];

  // Backward compatibility
  @Expose()
  get totalLikes(): number {
    return this.totalReactions;
  }
}
