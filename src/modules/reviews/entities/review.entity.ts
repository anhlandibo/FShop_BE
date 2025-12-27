/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ReviewStatus } from "src/constants";
import { ProductVariant } from "src/modules/products/entities";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ReviewImage } from "./review-image.entity";
import { ReviewVote } from "./review-vote.entity";
import { Order } from "src/modules/orders/entities";

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  @ManyToOne(() => Order, (order) => order.reviews)
  order: Order;

  @ManyToOne(() => ProductVariant, (variant) => variant.reviews)
  variant: ProductVariant;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ReviewImage, (image) => image.review, { cascade: true })
  images: ReviewImage[];

  @OneToMany(() => ReviewVote, (vote) => vote.review)
  votes: ReviewVote[];
}