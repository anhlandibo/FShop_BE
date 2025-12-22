import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  customer: User;

  @ManyToOne(() => User, { nullable: true })
  assignedAdmin?: User;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'HANDLING', 'CLOSED'],
    default: 'OPEN',
  })
  status: 'OPEN' | 'HANDLING' | 'CLOSED';

  @Column({ nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
