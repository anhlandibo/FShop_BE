import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StockLog } from './stock-log.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('stock_log_items')
export class StockLogItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => StockLog, (log) => log.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockLogId' })
  stockLog: StockLog;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column()
  quantity: number; 
}