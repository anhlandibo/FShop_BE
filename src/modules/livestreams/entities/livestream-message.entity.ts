import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Livestream } from './livestream.entity';
import { User } from '../../users/entities/user.entity';

@Entity('livestream_messages')
export class LivestreamMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Livestream)
  livestream: Livestream;

  @ManyToOne(() => User)
  user: User;

  @Column('text')
  content: string;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
