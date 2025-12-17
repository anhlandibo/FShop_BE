import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { NotificationType, OrderStatus } from 'src/constants';
import { PaymentStatus } from 'src/constants/payment-status.enum';
import { CouponRedemption } from '../coupons/entities/coupon-redemption.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly notiService: NotificationsService
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.debug('Running Cron Job: Scanning for stale pending orders...');

    // Quy định: Đơn hàng tạo quá 30 phút mà chưa thanh toán sẽ bị hủy
    const timeLimit = new Date(Date.now() - 30 * 60 * 1000); 

    // Tìm các đơn hàng thỏa mãn điều kiện
    const staleOrders = await this.orderRepo.find({
      where: {
        status: OrderStatus.PENDING,      
        paymentStatus: PaymentStatus.PENDING, 
        createdAt: LessThan(timeLimit),    
      },
      relations: ['items', 'items.variant', 'user'], 
    });

    if (staleOrders.length === 0) return;
    this.logger.log(`Found ${staleOrders.length} stale orders. Processing cancellation...`);

    for (const order of staleOrders) await this.cancelAndRestock(order);
    
  }

  private async cancelAndRestock(order: Order) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Hoàn trả tồn kho (Restock)
      for (const item of order.items) {
        // Cần check variant có tồn tại không (phòng trường hợp variant bị xóa mềm/cứng)
        if (item.variant) {
            const variant = await queryRunner.manager.findOne(ProductVariant, {
                where: { id: item.variant.id },
                lock: { mode: 'pessimistic_write' } // Khóa dòng này để tránh xung đột dữ liệu
            });

            if (variant) {
                // Logic cộng dồn: Ép kiểu Number để tránh cộng chuỗi
                const currentRemaining = Number(variant.remaining);
                const quantityToReturn = Number(item.quantity);
                
                variant.remaining = currentRemaining + quantityToReturn;
                await queryRunner.manager.save(variant);
                
                this.logger.debug(`-> Order #${order.id}: Restocked ${quantityToReturn} to Variant #${variant.id}`);
            }
        }
      }
      if (order.couponCode) {
          await queryRunner.manager.delete(CouponRedemption, {
            order: { id: order.id },
            isRedeemed: false,
          });
          this.logger.debug(`-> Order #${order.id}: Released coupon ${order.couponCode}`);
      }

      // 2. Cập nhật trạng thái đơn hàng
      order.status = OrderStatus.CANCELED;
      order.paymentStatus = PaymentStatus.CANCELED; // Hoặc FAILED tùy enum của bạn
      order.note = `${order.note || ''} \n[System]: Auto-canceled due to payment timeout.`;

      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      this.logger.log(`Successfully canceled Order #${order.id}`);

      if (order.user) {
         this.notiService.sendNotification(
             order.user.id,
             'Order has been automatically canceled',
             `Order #${order.id} has been automatically canceled due to payment timeout.`,
             NotificationType.ORDER
         ).catch(err => this.logger.error('Failed to send cron notification', err));
     }

    } catch (err) {
      this.logger.error(`Failed to cancel Order #${order.id}`, err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
} 