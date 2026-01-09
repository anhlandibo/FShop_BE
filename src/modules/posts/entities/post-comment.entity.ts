import { User } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_comments')
export class PostComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post: Post;

  @Column({ type: 'text' })
  content: string;

  // Threaded comments support (unlimited depth - Reddit/Facebook style)
  @ManyToOne(() => PostComment, (comment) => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  parentComment: PostComment | null;

  @OneToMany(() => PostComment, (comment) => comment.parentComment)
  replies: PostComment[];

  @Column({ type: 'int', default: 0 })
  replyCount: number;

  @Column({ type: 'int', default: 0 })
  depth: number; // 0 = root comment, 1+ = nested replies (auto-calculated)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
