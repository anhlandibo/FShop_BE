import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['customer'])
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  customer: User;

  @ManyToOne(() => User, { nullable: true })
  assignedAdmin?: User;

  @Column({ default: 'OPEN' })
  status: 'OPEN' | 'HANDLING';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastMessageAt: Date;
}
