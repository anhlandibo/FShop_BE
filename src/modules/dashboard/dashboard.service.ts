/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import {
  DateRange,
  OverviewResponseDto,
  RevenueDataDto,
  OrderStatusDataDto,
  TopProductDto,
  RecentOrderDto,
} from './dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  private getDateRangeFilter(range: DateRange): Date {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case DateRange.SEVEN_DAYS:
        startDate.setDate(now.getDate() - 7);
        break;
      case DateRange.THIRTY_DAYS:
        startDate.setDate(now.getDate() - 30);
        break;
      case DateRange.MONTH:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case DateRange.YEAR:
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return startDate;
  }

  async getOverview(range: DateRange): Promise<OverviewResponseDto> {
    const startDate = this.getDateRangeFilter(range);

    // Calculate revenue from completed orders
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere("order.status IN ('delivered', 'shipped', 'processing', 'confirmed')")
      .getRawOne();

    // Count total orders
    const totalOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startDate', { startDate })
      .getCount();

    // Calculate products sold
    const productsSoldResult = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .select('COALESCE(SUM(orderItem.quantity), 0)', 'sold')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere("order.status IN ('delivered', 'shipped', 'processing', 'confirmed')")
      .getRawOne();

    // Count new customers
    const newCustomers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :startDate', { startDate })
      .andWhere("user.role = 'user'")
      .getCount();

    // Count low stock variants (remaining < 10)
    const lowStockVariants = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.remaining < :threshold', { threshold: 10 })
      .andWhere('variant.remaining > 0')
      .andWhere('variant.isActive = true')
      .getCount();

    return {
      revenue: parseFloat(revenueResult.revenue) || 0,
      totalOrders,
      productsSold: parseInt(productsSoldResult.sold) || 0,
      newCustomers,
      lowStockVariants,
    };
  }

  async getRevenue(range: DateRange): Promise<RevenueDataDto[]> {
    const startDate = this.getDateRangeFilter(range);

    let groupByFormat: string;

    // Determine date format based on range
    switch (range) {
      case DateRange.SEVEN_DAYS:
      case DateRange.THIRTY_DAYS:
        groupByFormat = 'YYYY-MM-DD';
        break;
      case DateRange.MONTH:
        groupByFormat = 'YYYY-MM-DD';
        break;
      case DateRange.YEAR:
        groupByFormat = 'YYYY-MM';
        break;
    }

    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select(`TO_CHAR(order.createdAt, '${groupByFormat}')`, 'date')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere("order.status IN ('delivered', 'shipped', 'processing', 'confirmed')")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((row) => ({
      date: row.date,
      total: parseFloat(row.total) || 0,
    }));
  }

  async getOrderStatus(range: DateRange): Promise<OrderStatusDataDto[]> {
    const startDate = this.getDateRangeFilter(range);

    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('order.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map((row) => ({
      status: row.status,
      count: parseInt(row.count) || 0,
    }));
  }

  async getTopProducts(range: DateRange): Promise<TopProductDto[]> {
    const startDate = this.getDateRangeFilter(range);

    const results = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .innerJoin('orderItem.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('COALESCE(SUM(orderItem.quantity), 0)', 'sold')
      .addSelect('COALESCE(SUM(orderItem.quantity * orderItem.price), 0)', 'revenue')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere("order.status IN ('delivered', 'shipped', 'processing', 'confirmed')")
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('sold', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((row) => ({
      productId: row.productId,
      name: row.name,
      sold: parseInt(row.sold) || 0,
      revenue: parseFloat(row.revenue) || 0,
    }));
  }

  async getRecentOrders(): Promise<RecentOrderDto[]> {
    const results = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .select([
        'order.id',
        'order.recipientName',
        'order.recipientPhone',
        'order.province',
        'order.district',
        'order.status',
        'order.totalAmount',
        'order.createdAt',
      ])
      .addSelect('COUNT(items.id)', 'itemsCount')
      .groupBy('order.id')
      .orderBy('order.createdAt', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((row) => ({
      id: row.order_id,
      recipientName: row.order_recipientName,
      recipientPhone: row.order_recipientPhone,
      province: row.order_province,
      district: row.order_district,
      status: row.order_status,
      totalAmount: parseFloat(row.order_totalAmount) || 0,
      createdAt: row.order_createdAt,
      itemsCount: parseInt(row.itemsCount) || 0,
    }));
  }
}
