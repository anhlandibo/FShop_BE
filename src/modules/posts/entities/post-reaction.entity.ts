/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, Unique, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Post } from './post.entity';
import { ReactionType } from 'src/constants';

@Entity('post_reactions')
@Unique(['post', 'user'])
export class PostReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.reactions, { onDelete: 'CASCADE' })
  @Exclude()
  post: Post;

  @ManyToOne(() => User, (user) => user.postReactions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
