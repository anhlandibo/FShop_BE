import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { StockLogType } from '../../../constants/stock-log-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('stock_logs')
@Index(['variant', 'createdAt'])
@Index(['type', 'createdAt'])
export class StockLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductVariant, { eager: true })
  variant: ProductVariant;

  @Column()
  quantity: number;

  @Column({
    type: 'enum',
    enum: StockLogType,
  })
  type: StockLogType;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
