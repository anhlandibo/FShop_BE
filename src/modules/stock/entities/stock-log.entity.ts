import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  OneToMany,
} from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { StockLogType } from '../../../constants/stock-log-type.enum';
import { User } from '../../users/entities/user.entity';
import { StockLogItem } from './stock-log-item.entity';

@Entity('stock_logs')
@Index(['type', 'createdAt'])
export class StockLog {
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToMany(() => StockLogItem, (item) => item.stockLog, { cascade: true })
  items: StockLogItem[];
}
