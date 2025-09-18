import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponTarget } from './entities/coupon-target.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';

@Module({
  controllers: [CouponsController],
  providers: [CouponsService],
  imports: [TypeOrmModule.forFeature([Coupon, CouponTarget, CouponRedemption])]
})
export class CouponsModule {}
