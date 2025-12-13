/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';
import { PaymentMethod } from 'src/constants/payment-method.enum';
import { PaymentStatus } from 'src/constants/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() 
  orderId: number;

  @OneToOne(() => Order, (order) => order.payment, { nullable: false })
  @JoinColumn({ name: 'orderId' }) 
  order: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.PAYPAL,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // PayPal order id (token)
  @Column({ nullable: true })
  providerPaymentId: string;

  // PayPal payer id (nếu cần)
  @Column({ nullable: true })
  providerPayerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // Lưu raw response từ PayPal cho debug / đối soát
  @Column({ type: 'jsonb', nullable: true })
  rawResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
