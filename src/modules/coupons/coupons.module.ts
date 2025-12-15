import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponTarget } from './entities/coupon-target.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { ProductVariant } from '../products/entities';
import { Cart } from '../carts/entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [CouponsController],
  providers: [CouponsService],
  imports: [TypeOrmModule.forFeature([Coupon, CouponTarget, CouponRedemption, ProductVariant, Cart]), NotificationsModule],
  exports: [CouponsService],
})
export class CouponsModule {}
