import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController, AdminOrdersController } from './dashboard.controller';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, ProductVariant, OrderItem]),
  ],
  controllers: [DashboardController, AdminOrdersController],
  providers: [DashboardService],
})
export class DashboardModule {}
