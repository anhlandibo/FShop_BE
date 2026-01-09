import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Livestream } from './livestream.entity';
import { User } from '../../users/entities/user.entity';

@Entity('livestream_views')
export class LivestreamView {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Livestream)
  livestream: Livestream;

  @ManyToOne(() => User, { nullable: true })
  user: User | null;

  @Column({ nullable: true, type: 'varchar' })
  guestId: string | null;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @Column({ type: 'int', default: 0 })
  watchDuration: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
