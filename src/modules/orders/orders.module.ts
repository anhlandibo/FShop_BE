import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities';
import { ProductVariant } from '../products/entities';
import { Cart, CartItem } from '../carts/entities';
import { Address } from '../address/entities/address.entity';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { Payment } from '../payments/entities/payment.entity';
import { OrdersCronService } from './orders.cron.service';
import { CouponsModule } from '../coupons/coupons.module';
import { CouponRedemption } from '../coupons/entities/coupon-redemption.entity';
import { StockModule } from '../stock/stock.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersCronService],
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Address, ProductVariant, Cart, CartItem, Payment, CouponRedemption]),
    NotificationsModule,
    CouponsModule,
    StockModule,
  ],
  exports: [OrdersService],
})
export class OrdersModule { }
