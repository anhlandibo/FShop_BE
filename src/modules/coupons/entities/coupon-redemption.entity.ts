import { Order } from "src/modules/orders/entities";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Coupon } from "./coupon.entity";

@Entity('coupon_redemptions')
@Unique(['coupon', 'order'])
export class CouponRedemption {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coupon, (coupon) => coupon.redemptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Index()
  user: User;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ default: false })
  isRedeemed: boolean;

  @CreateDateColumn()
  appliedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date;
}