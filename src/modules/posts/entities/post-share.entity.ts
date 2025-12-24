import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, ManyToOne, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_shares')
export class PostShare {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.shares, { onDelete: 'CASCADE' })
  @Exclude()
  post: Post;

  @ManyToOne(() => User, (user) => user.postShares, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
