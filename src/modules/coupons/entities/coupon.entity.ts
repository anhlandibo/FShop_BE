import { CouponStatus, DiscountType } from "src/constants";
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CouponTarget } from "./coupon-target.entity";
import { CouponRedemption } from "./coupon-redemption.entity";

@Entity('coupons')
@Index('IDX_COUPON_CODE_ACTIVE', ['code'], { unique: true, where: '"isActive" = true' })
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ nullable: true })
  name: string;

  @Column({type: 'text', nullable: true})
  description: string;

  @Column({type: 'enum', enum: DiscountType, default: DiscountType.PERCENTAGE})
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderAmount: number;

  @Column({ type: 'int', default: 0 })
  usageLimit: number;

  @Column({ type: 'int', nullable: true })
  usageCount: number;

  @Column({ type: 'int', default: 0 })
  usageLimitPerUser: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({type: 'enum', enum: CouponStatus, default: CouponStatus.ACTIVE})
  status: CouponStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => CouponTarget, (target) => target.coupon)
  targets: CouponTarget[];

  @OneToMany(() => CouponRedemption, (redemption) => redemption.coupon)
  redemptions: CouponRedemption[];

}