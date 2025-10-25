import { Exclude } from "class-transformer";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Review } from "./review.entity";

@Entity('review_images')
export class ReviewImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  publicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Review, (review) => review.images, { onDelete: 'CASCADE' })
  @Exclude()
  review: Review;
}