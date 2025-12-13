/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Order, OrderItem } from './entities';
import { DataSource, FindOptionsWhere, Like, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Cart, CartItem } from '../carts/entities';
import { OrderStatus, Role, ShippingMethod } from 'src/constants';
import { ProductVariant } from '../products/entities';
import { Address } from '../address/entities/address.entity';
import { ActorRole, ensureTransitionAllowed } from 'src/utils/order-status.rules';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { OrderQueryDto } from 'src/dto/orderQuery.dto';
import { PaymentStatus } from 'src/constants/payment-status.enum';
import { CouponsService } from '../coupons/coupons.service';
import { CouponRedemption } from '../coupons/entities/coupon-redemption.entity';

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
    @InjectDataSource() private readonly dataSource: DataSource,
    private notiService: NotificationsService,
    private couponsService: CouponsService,
  ) {}


  private calculateShippingFee(shippingMethod: ShippingMethod): number {
    switch (shippingMethod) {
      case ShippingMethod.STANDARD:
        return 10; 
      case ShippingMethod.EXPRESS:
        return 20; 
      default:
        return 30000;
    }
  }

  async create(userId: number, createOrderDto: CreateOrderDto) {
    return await this.dataSource.manager.transaction(async (manager) => {
      const { addressId, note, items, paymentMethod, shippingMethod, couponCode } = createOrderDto;

      // 1. Validate address
      const address = await manager.findOne(Address, {
        where: { user: { id: userId }, id: addressId },
      });
      if (!address)
        throw new HttpException('Address not found', HttpStatus.NOT_FOUND);

      // 2. Get cart with items
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.variant', 'user', 'items.variant.product'],
      });
      if (!cart || cart.items.length == 0)
        throw new HttpException('Cart is empty', HttpStatus.NOT_FOUND);

      // 3. Calculate shipping fee
      const shippingFee = this.calculateShippingFee(shippingMethod);

      // 4. Create order (without totalAmount first)
      const order = manager.create(Order, {
        user: cart.user,
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
      for (const item of items) {
        const cartItem = cart.items.find(
          (cartItem) => cartItem.variant.id === item.variantId,
        );
        if (!cartItem)
          throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);

        // Check stock
        if (item.quantity > cartItem.variant.remaining)
          throw new HttpException(
            `Not enough stock for ${cartItem.variant.product.name}`,
            HttpStatus.BAD_REQUEST,
          );

        // Reduce stock
        cartItem.variant.remaining -= item.quantity;
        await manager.save(ProductVariant, cartItem.variant);

        // Create order item
        const orderItem = manager.create(OrderItem, {
          order,
          variant: cartItem.variant,
          quantity: item.quantity,
          price: cartItem.variant.product.price,
        });
        await manager.save(orderItem);
        subtotal += item.quantity * Number(orderItem.price);

        // Update cart
        if (item.quantity >= cartItem.quantity) {
          await manager.remove(cartItem);
        } else {
          cartItem.quantity -= item.quantity;
          await manager.save(CartItem, cartItem);
        }
      }

      // 6. Apply coupon if provided
      let discountAmount = 0;
      if (couponCode) {
        try {
          const couponResult = await this.couponsService.apply(couponCode, order.id, userId);
          discountAmount = Number(couponResult.discountAmount) || 0;
        } catch (error: any) {
          // If coupon application fails, rollback the transaction
          throw new HttpException(
            error?.message || 'Failed to apply coupon',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 7. Calculate final total amount
      order.discountAmount = discountAmount;
      order.totalAmount = Math.max(0, Math.round(subtotal + shippingFee - discountAmount));
      await manager.save(order);

      // 8. Create notification
      await this.notiService.create({
        message: `Order #${order.id} has been created`,
        title: `Order #${order.id} has been created`,
        userId: order.user.id,
      });

      return order;
    });
  }

  async getMyOrders(userId: number, query: OrderQueryDto) {
    const { page, limit, sortBy = 'id', sortOrder = 'DESC', status } = query;
    const [data, total] = await this.orderRepository.findAndCount({
      where: {
        user: { id: userId },
        ...(status && { status })
      },
      relations: ['items', 'items.variant'],
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
    });
    const response = { pagination: { total, page, limit }, data };
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
      if (next === OrderStatus.CANCELED) {
        // Restore stock
        for (const it of order.items) {
          const variant = await manager.findOne(ProductVariant, {
            where: { id: it.variant.id },
          });
          if (variant) {
            variant.remaining = Number(variant.remaining) + Number(it.quantity);
            await manager.save(variant);
          }
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
            console.log(`Removed unredeemed coupon ${order.couponCode} for canceled order #${order.id}`);
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
          console.log(`Coupon ${order.couponCode} redeemed for order #${order.id}`);
        } catch (error: any) {
          console.error(`Failed to redeem coupon: ${error?.message}`);
          // Don't rollback order confirmation if coupon redeem fails
          // Just log the error
        }
      }

      const prev = order.status;
      order.status = next;
      await manager.save(order);
      return { message: 'Order status updated', from: prev, to: next };
    });
  }
}
