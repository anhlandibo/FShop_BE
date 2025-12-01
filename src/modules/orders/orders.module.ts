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

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersCronService],
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Address, ProductVariant, Cart, CartItem, Payment]), NotificationsModule],
  exports: [OrdersService],
})
export class OrdersModule { }
