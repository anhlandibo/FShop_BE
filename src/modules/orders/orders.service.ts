/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  HttpException,
  HttpStatus,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Order, OrderItem } from './entities';
import { DataSource, FindOptionsWhere, Like, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Cart, CartItem } from '../carts/entities';
import { NotificationType, OrderStatus, Role, ShippingMethod } from 'src/constants';
import { ProductVariant } from '../products/entities';
import { Address } from '../address/entities/address.entity';
import {
  ActorRole,
  ensureTransitionAllowed,
} from 'src/utils/order-status.rules';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { OrderQueryDto } from 'src/dto/orderQuery.dto';
import { PaymentStatus } from 'src/constants/payment-status.enum';
import { CouponsService } from '../coupons/coupons.service';
import { CouponRedemption } from '../coupons/entities/coupon-redemption.entity';
import { StockService } from '../stock/stock.service';
import { Review } from '../reviews/entities/review.entity';
import { StockLogType } from 'src/constants/stock-log-type.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(CouponRedemption)
    private readonly couponRedemptionRepo: Repository<CouponRedemption>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private notiService: NotificationsService,
    private couponsService: CouponsService,
    private stockService: StockService,
  ) {}

  private calculateShippingFee(shippingMethod: ShippingMethod): number {
    switch (shippingMethod) {
      case ShippingMethod.STANDARD:
        return 10;
      case ShippingMethod.EXPRESS:
        return 20;
      default:
        return 30;
    }
  }

  async create(userId: number, createOrderDto: CreateOrderDto) {
    return await this.dataSource.manager.transaction(async (manager) => {
      const {
        addressId,
        note,
        items,
        paymentMethod,
        shippingMethod,
        couponCode,
      } = createOrderDto;

      // 1. Validate address
      const address = await manager.findOne(Address, {
        where: { user: { id: userId }, id: addressId },
      });
      if (!address)
        throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      // 2. Get cart with items
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.variant', 'user', 'items.variant.product'],
      });
      

      // 3. Calculate shipping fee
      const shippingFee = this.calculateShippingFee(shippingMethod);

      // 4. Create order (without totalAmount first)
      const order = manager.create(Order, {
        user: user,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        detailAddress: address.detailAddress,
        province: address.province,
        district: address.district,
        commune: address.commune,
        status: OrderStatus.PENDING,
        note: note,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        shippingMethod,
        shippingFee,
        totalAmount: 0,
        discountAmount: 0,
        ...(couponCode && { couponCode }),
      });
      await manager.save(order);

      // 5. Process order items and calculate subtotal
      let subtotal = 0;
      const orderItemsData: any[] = [];
      const stockLogItems: { variant: ProductVariant; quantity: number }[] = [];

      for (const itemDto of items) {
        const variant = await manager.findOne(ProductVariant, {
          where: { id: itemDto.variantId },
          lock: { mode: 'pessimistic_write' }
        });

        if (!variant) {
          throw new HttpException(
            `Variant ID ${itemDto.variantId} not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        const variantWithProduct = await manager.findOne(ProductVariant, {
            where: { id: itemDto.variantId },
            relations: ['product', 'product.category'],
        });
        if (!variantWithProduct) {
             throw new HttpException(
                `Variant ID ${itemDto.variantId} not found`,
                HttpStatus.NOT_FOUND,
             );
        }
        variant.product = variantWithProduct.product;

        // B. Check stock
        if (itemDto.quantity > variant.remaining)
          throw new HttpException(
            `Not enough stock for ${variant.product.name}`,
            HttpStatus.BAD_REQUEST,
          );

        // C. Reduce stock and log it
        variant.remaining -= itemDto.quantity;
        await manager.save(ProductVariant, variant);

        stockLogItems.push({
          variant: variant,
          quantity: itemDto.quantity
        });

        const orderItem = manager.create(OrderItem, {
          order,
          variant: variant,
          quantity: itemDto.quantity,
          price: variant.product.price, 
        });
        await manager.save(orderItem);

        subtotal += itemDto.quantity * Number(orderItem.price);

        orderItemsData.push({
          variantId: variant.id,
          quantity: itemDto.quantity,
          price: Number(variant.product.price),
          product: variant.product,
          category: variant.product.category,
        });

        if (cart && cart.items.length > 0) {
          const cartItem = cart.items.find(
            (ci) => ci.variant.id === variant.id,
          );

          if (cartItem) {
            // Nếu số lượng mua >= số lượng trong cart -> Xóa khỏi cart
            if (itemDto.quantity >= cartItem.quantity) {
              await manager.remove(cartItem);
            } else {
              // Nếu số lượng mua ít hơn trong cart -> Trừ bớt
              cartItem.quantity -= itemDto.quantity;
              await manager.save(CartItem, cartItem);
            }
          }
        }
      }
      
      if (stockLogItems.length > 0) {
        await this.stockService.createLog(
          manager,
          StockLogType.OUT,
          `Export stock for order #${order.id}`,
          stockLogItems,
          userId,
        );
      }

      let discountAmount = 0;
      if (couponCode) {
        try {
          const couponResult = await this.couponsService.calculateDiscount(
            couponCode,
            userId,
            orderItemsData,
            shippingFee,
          );
          discountAmount = Number(couponResult.discountAmount) || 0;

          await this.couponsService.apply(
            couponCode,
            order.id,
            userId,
            manager,
          );
        } catch (error: any) {
          throw new HttpException(
            error?.message || 'Failed to apply coupon',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 7. Calculate final total amount
      order.discountAmount = discountAmount;
      order.totalAmount = Math.max(
        0,
        Math.round(subtotal + shippingFee - discountAmount),
      );
      await manager.save(order);

      // 8. Create notification
      this.notiService.sendNotification(
          userId, 
          'Place order successfully! 🎉', 
          `Order #${order.id} is pending.`,
          NotificationType.ORDER
      ).catch(console.error);

      this.notiService.sendToAdmin(
          'New Order 📦',
          `User #${userId} has placed a new order #${order.id}`,
          NotificationType.ORDER
      ).catch(console.error);

      return order;
    });
  }

  async getMyOrders(userId: number, query: OrderQueryDto) {
    const { page, limit, sortBy = 'id', sortOrder = 'DESC', status } = query;
    const [data, total] = await this.orderRepository.findAndCount({
      where: {
        user: { id: userId },
        ...(status && { status }),
      },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.variantAttributeValues',
        'items.variant.variantAttributeValues.attributeCategory',
        'items.variant.variantAttributeValues.attributeCategory.attribute',
      ],
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
    });

    // Get all order IDs for review checking
    const orderIds = data.map(order => order.id);

    // Query all reviews for these orders by this user
    let reviews: Review[] = [];
    if (orderIds.length > 0) {
      reviews = await this.reviewRepository
        .createQueryBuilder('review')
        .innerJoin('review.order', 'order')
        .innerJoin('review.variant', 'variant')
        .innerJoin('review.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('order.id IN (:...orderIds)', { orderIds })
        .select(['review.id', 'order.id', 'variant.id'])
        .getMany();
    }

    // Create a map for quick lookup: key = "orderId-variantId", value = true
    const reviewMap = new Map<string, boolean>();
    reviews.forEach(review => {
      const key = `${review.order.id}-${review.variant.id}`;
      reviewMap.set(key, true);
    });

    // Add isReviewed field to each order item
    const enhancedData = data.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        isReviewed: reviewMap.has(`${order.id}-${item.variant.id}`),
      })),
    }));

    const response = { pagination: { total, page, limit }, data: enhancedData };
    console.log('data lay tu DB');
    return response;
  }

  async getOrderById(userId: number, id: number) {
    const order = await this.orderRepository.findOne({
      where: { user: { id: userId }, id },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.variantAttributeValues',
        'items.variant.variantAttributeValues.attributeCategory',
        'items.variant.variantAttributeValues.attributeCategory.attribute',
      ],
    });
    if (!order)
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    return order;
  }

  /**
   * Ensures that the order belongs to the specified user.
   * Throws HttpException if order not found or user is not the owner.
   */
  async ensureOrderOwnership(orderId: number, userId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    if (order.user.id !== userId) {
      throw new HttpException(
        'Forbidden: You can only cancel your own orders',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async getAll(query: OrderQueryDto) {
    const {
      page,
      limit,
      search,
      sortBy = 'id',
      sortOrder = 'DESC',
      status,
    } = query;
    const where: FindOptionsWhere<Order>[] = [];
    if (search) {
      where.push(
        { note: Like(`%${search}%`), ...(status && { status }) },
        { detailAddress: Like(`%${search}%`), ...(status && { status }) },
      );
    } else {
      // Không search → filter status (nếu có)
      where.push({ ...(status && { status }) });
    }
    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['items', 'items.variant', 'user'],
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
    });
    const response = {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
    console.log('data lay tu DB');
    return response;
  }

  async updateStatus(
    orderId: number,
    next: OrderStatus,
    actor: { id: number; role: ActorRole; reason?: string },
  ) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.variant', 'user'],
      });
      if (!order)
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);

      try {
        ensureTransitionAllowed(order.status, next, actor.role);
      } catch (e) {
        throw new HttpException(String(e), HttpStatus.BAD_REQUEST);
      }

      // Handle CANCELED status - restore stock and remove coupon redemption
      if (next === OrderStatus.CANCELED || next === OrderStatus.RETURNED) {
        const stockLogItems: { variant: ProductVariant; quantity: number }[] = [];
        for (const it of order.items) {
          const variant = await manager
            .createQueryBuilder(ProductVariant, 'variant')
            .innerJoinAndSelect('variant.product', 'product')
            .where('variant.id = :id', { id: it.variant.id })
            .setLock('pessimistic_write')
            .getOne();
          if (variant) {
            variant.remaining = Number(variant.remaining) + Number(it.quantity);
            await manager.save(variant);
            stockLogItems.push({ variant, quantity: Number(it.quantity) });
          }
        }

        if (stockLogItems.length > 0) {
          const reasonNote = next === OrderStatus.CANCELED 
            ? `Return products for shop for order #${order.id}` 
            : `Return products for order #${order.id}`;
            
          await this.stockService.createLog(
            manager,
            StockLogType.IN,
            `${reasonNote}${actor.reason ? ` - Reason: ${actor.reason}` : ''}`,
            stockLogItems,
            actor.id
          );
        }

        // Remove coupon redemption if not yet redeemed
        if (order.couponCode) {
          const redemption = await manager.findOne(CouponRedemption, {
            where: {
              order: { id: order.id },
              isRedeemed: false,
            },
          });

          if (redemption) {
            await manager.remove(redemption);
            console.log(
              `Removed unredeemed coupon ${order.couponCode} for canceled order #${order.id}`,
            );
          }
        }
      }

      // Handle CONFIRMED status - redeem coupon
      if (next === OrderStatus.CONFIRMED && order.couponCode) {
        try {
          await this.couponsService.redeem(
            order.couponCode,
            order.id,
            order.user.id,
          );
          console.log(
            `Coupon ${order.couponCode} redeemed for order #${order.id}`,
          );
        } catch (error: any) {
          console.error(`Failed to redeem coupon: ${error?.message}`);
          // Don't rollback order confirmation if coupon redeem fails
          // Just log the error
        }
      }

      const prev = order.status;
      order.status = next;
      await manager.save(order);

      if (prev !== next && order.user) {
         let title = `Update order #${orderId}`;
         let message = `Order status: ${next} status`;

         switch (next) {
              case OrderStatus.CONFIRMED:
                  message = `Order #${order.id} has been confirmed and is now being processed.`;
                  break;
              case OrderStatus.SHIPPED:
                  message = `Shipper is now processing your order #${order.id}.`;
                  break;
              case OrderStatus.CANCELED:
                  title = `Order #${orderId} has been canceled`;
                  message = `Reason: ${actor.reason || 'None'}`;
                  break;
              case OrderStatus.DELIVERED:
                  title = `Order #${orderId} has been delivered`;
                  message = `Order #${order.id} has been successfully delivered. Enjoy your purchase!`;
                  break;
          }

          // Gửi thông báo cho User
          this.notiService.sendNotification(order.user.id, title, message, NotificationType.ORDER).catch(console.error);
      }

      return { message: 'Order status updated', from: prev, to: next };
    });
  }

  async userConfirmDelivery(orderId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['user'],
      });

      if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      if (order.user.id !== userId) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      
      // Chỉ cho phép confirm khi đang giao hàng
      if (order.status !== OrderStatus.SHIPPED) {
         throw new HttpException('Order must be in SHIPPING status to confirm', HttpStatus.BAD_REQUEST);
      }

      // Update trạng thái
      order.status = OrderStatus.DELIVERED;
      // Nếu là COD thì khi nhận hàng xong coi như đã thanh toán
      if (order.paymentStatus === PaymentStatus.PENDING) {
          order.paymentStatus = PaymentStatus.COMPLETED;
      }
      order.updatedAt = new Date();
      await manager.save(order);

      // 1. Báo Admin
      this.notiService.sendToAdmin(
          'User confirmed delivery',
          `User ${order.user.fullName} has confirmed delivery of order #${order.id}`,
          NotificationType.ORDER
      ).catch(console.error);

      // 2. Cảm ơn User
      this.notiService.sendNotification(
          userId,
          'Thanks for shopping with us! 🎉',
          `Order #${order.id} has been delivered.`,
          NotificationType.ORDER
      ).catch(console.error);

      return { success: true, status: OrderStatus.DELIVERED };
    });
  }
}
