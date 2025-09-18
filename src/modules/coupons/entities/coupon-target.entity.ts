import { TargetType } from "src/constants/target-type.enum";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Coupon } from "./coupon.entity";

@Entity()
export class CouponTarget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'enum', enum: TargetType, default: TargetType.ALL})
  targetType: TargetType;

  @Column({ type: 'int', nullable: true })
  targetId: number | null;

  @ManyToOne(() => Coupon, (coupon) => coupon.targets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;
}