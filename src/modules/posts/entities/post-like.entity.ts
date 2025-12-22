import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, Unique, ManyToOne, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_likes')
@Unique(['post', 'user'])
export class PostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @Exclude()
  post: Post;

  @ManyToOne(() => User, (user) => user.postLikes, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
