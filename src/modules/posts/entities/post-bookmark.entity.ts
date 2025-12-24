import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, Unique, ManyToOne, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_bookmarks')
@Unique(['post', 'user'])
export class PostBookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.bookmarks, { onDelete: 'CASCADE' })
  @Exclude()
  post: Post;

  @ManyToOne(() => User, (user) => user.postBookmarks, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
