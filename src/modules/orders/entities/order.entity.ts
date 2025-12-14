import { Exclude } from "class-transformer";
import { OrderStatus, ShippingMethod } from "src/constants";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from ".";
import { Review } from "src/modules/reviews/entities/review.entity";
import { PaymentMethod } from "src/constants/payment-method.enum";
import { PaymentStatus } from "src/constants/payment-status.enum";
import { Payment } from "src/modules/payments/entities/payment.entity";

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

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: ShippingMethod,
    default: ShippingMethod.STANDARD,
  })
  shippingMethod: ShippingMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ nullable: true })
  couponCode: string;

  @ManyToOne(() => User, (user) => user.orders)
  @Exclude()
  user: User;

  @OneToMany(() => Review, (review) => review.order)
  reviews: Review[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}