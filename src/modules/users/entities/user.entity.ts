import { Role } from 'src/constants/role.enum';
import { Address } from 'src/modules/address/entities/address.entity';
import { Cart } from 'src/modules/carts/entities';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Order } from 'src/modules/orders/entities';
import { ReviewVote } from 'src/modules/reviews/entities/review-vote.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { Wishlist } from 'src/modules/wishlists/entities/wishlist.entity';
import { Post } from 'src/modules/posts/entities/post.entity';
import { PostLike } from 'src/modules/posts/entities/post-like.entity';
import { PostBookmark } from 'src/modules/posts/entities/post-bookmark.entity';
import { PostShare } from 'src/modules/posts/entities/post-share.entity';
import { PostReaction } from 'src/modules/posts/entities/post-reaction.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  publicId: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @Column({ default: false }) 
  isVerified: boolean;

  @Column({ default: true }) 
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Cart, (cart) => cart.user, { cascade: true })
  cart: Cart;

  @OneToMany(() => Address, address => address.user)
  addresses: Address[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Wishlist, wishlist => wishlist.user)
  wishlist: Wishlist[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];

  @OneToMany(() => ReviewVote, (vote) => vote.user)
  reviewVotes: ReviewVote[];

  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @OneToMany(() => PostLike, (like) => like.user)
  postLikes: PostLike[];

  @OneToMany(() => PostReaction, (reaction) => reaction.user)
  postReactions: PostReaction[];

  @OneToMany(() => PostBookmark, (bookmark) => bookmark.user)
  postBookmarks: PostBookmark[];

  @OneToMany(() => PostShare, (share) => share.user)
  postShares: PostShare[];
}
