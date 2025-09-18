import { Order } from "src/modules/orders/entities";
import { User } from "src/modules/users/entities/user.entity";
import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Coupon } from "./coupon.entity";

@Entity()
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

  @CreateDateColumn()
  redeemedAt: Date;
}