/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { StockLog } from './entities/stock-log.entity';
import { StockLogItem } from './entities/stock-log-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { StockLogQueryDto } from './dto/stock-log-query.dto';
import { StockLogType } from '../../constants/stock-log-type.enum';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockLog)
    private stockLogRepository: Repository<StockLog>,
    @InjectRepository(StockLogItem)
    private stockLogItemRepository: Repository<StockLogItem>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    private dataSource: DataSource,
  ) {}

  async createStockIn(createStockInDto: CreateStockInDto, userId?: number) {
    return await this.dataSource.transaction(async (manager) => {
      const { items, note } = createStockInDto;
      const logItems: { variant: ProductVariant; quantity: number }[] = [];

      for (const item of items) {
        const variant = await manager.findOne(ProductVariant, {
          where: { id: item.variantId },
          relations: ['product'],
        });

        if (!variant) {
          throw new HttpException(
            `Variant ID ${item.variantId} not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        variant.quantity += item.quantity;
        variant.remaining += item.quantity;
        await manager.save(ProductVariant, variant);

        logItems.push({ variant, quantity: item.quantity });
      }

      const stockLog = await this.createLog(
        manager,
        StockLogType.IN,
        note || `Import stock`,
        logItems,
        userId,
      );

      return {
        message: 'Stock imported successfully',
        data: stockLog,
      };
    });
  }

  async getStockLogs(query: StockLogQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      type,
      variantId,
    } = query;

    const queryBuilder = this.stockLogRepository
      .createQueryBuilder('stock_log')
      .leftJoinAndSelect('stock_log.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('stock_log.createdBy', 'user')
      .select([
        'stock_log',
        'items.id',
        'items.quantity',
        'variant.id',
        'variant.quantity',
        'variant.remaining',
        'product.id',
        'product.name',
        'user.id',
        'user.fullName',
        'user.email',
      ]);

    if (type) {
      queryBuilder.andWhere('stock_log.type = :type', { type });
    }

    // Filter logs that contain specific variant
    if (variantId) {
      queryBuilder.andWhere('items.variant.id = :variantId', { variantId });
    }

    queryBuilder.orderBy(`stock_log.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStockSummary(variantId: number) {
    const variant = await this.productVariantRepository.findOne({
      where: { id: variantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new HttpException('Variant not found', HttpStatus.NOT_FOUND);
    }

    // Calculate totals using the new table structure
    const totalIn = await this.stockLogItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.stockLog', 'log')
      .where('item.variantId = :variantId', { variantId })
      .andWhere('log.type = :type', { type: StockLogType.IN })
      .select('SUM(item.quantity)', 'total')
      .getRawOne();

    const totalOut = await this.stockLogItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.stockLog', 'log')
      .where('item.variantId = :variantId', { variantId })
      .andWhere('log.type = :type', { type: StockLogType.OUT })
      .select('SUM(item.quantity)', 'total')
      .getRawOne();

    return {
      variant: { id: variant.id, productName: variant.product.name },
      currentStock: {
        quantity: variant.quantity,
        remaining: variant.remaining,
        reserved: variant.quantity - variant.remaining,
      },
      history: {
        totalIn: Number(totalIn?.total) || 0,
        totalOut: Number(totalOut?.total) || 0,
      },
    };
  }


  async createLog(
    manager: EntityManager,
    type: StockLogType,
    note: string,
    items: { variant: ProductVariant; quantity: number }[],
    userId?: number,
  ): Promise<StockLog> {
    // 1. Create Parent Log
    const stockLog = manager.create(StockLog, {
      type,
      note,
      items: [], // Init empty array
      ...(userId && { createdBy: { id: userId } as any }),
    });

    // 2. Create Child Items
    const logItems = items.map((item) => {
      return manager.create(StockLogItem, {
        variant: item.variant,
        quantity: item.quantity,
      });
    });

    stockLog.items = logItems;

    // 3. Save Cascade (Log + Items)
    return await manager.save(StockLog, stockLog);
  }

  async getStockLogsByVariant(variantId: number, query: StockLogQueryDto) {
    const variant = await this.productVariantRepository.findOne({
      where: { id: variantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new HttpException(
        `Variant ID ${variantId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const logsResult = await this.getStockLogs({
      ...query,
      variantId: variantId, 
    });

    return {
      variant: {
        id: variant.id,
        name: variant.product.name,
        currentStock: variant.quantity,
        remaining: variant.remaining,
      },
      ...logsResult, 
    };
  }
}