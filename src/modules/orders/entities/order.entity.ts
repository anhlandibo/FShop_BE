import { Exclude } from "class-transformer";
import { OrderStatus } from "src/constants";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from ".";
import { PaymentStatus } from "src/constants/payment-status.enum";
import { Review } from "src/modules/reviews/entities/review.entity";

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipientName: string;

  @Column()
  recipientPhone: string;

  @Column()
  detailAddress: string;

  @Column()
  province: string;

  @Column()
  district: string;

  @Column()
  commune: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true})
  paymentMethod: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paymentTxnRef: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => User, (user) => user.orders)
  @Exclude()
  user: User;

  @OneToMany(() => Review, (review) => review.order)
  reviews: Review[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}