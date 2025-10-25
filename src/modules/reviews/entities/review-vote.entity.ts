import { Exclude } from "class-transformer";
import { User } from "src/modules/users/entities/user.entity";
import { Entity, Unique, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";
import { Review } from "./review.entity";

@Entity('review_votes')
@Unique(['review', 'user']) // 1 user chỉ có thể vote 1 lần / 1 review
export class ReviewVote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Review, (review) => review.votes, { onDelete: 'CASCADE' })
  @Exclude()
  review: Review;

  @ManyToOne(() => User, (user) => user.reviewVotes, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'boolean', default: true })
  isHelpful: boolean;

  @CreateDateColumn()
  createdAt: Date;
}