/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { LivestreamStatus } from 'src/constants';


@Entity('livestreams')
export class Livestream {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ unique: true })
  streamKey: string;

  @Column({ type: 'enum', enum: LivestreamStatus, default: LivestreamStatus.Scheduled })
  status: LivestreamStatus;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'int', default: 0 })
  currentViewers: number;

  @Column({ type: 'int', default: 0 })
  peakViewers: number;

  @Column({ type: 'int', default: 0 })
  totalViews: number;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  recordingUrl: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToMany(() => Product)
  @JoinTable({ name: 'livestream_products' })
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}