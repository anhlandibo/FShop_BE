/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { StockLog } from './entities/stock-log.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { StockLogQueryDto } from './dto/stock-log-query.dto';
import { StockLogType } from '../../constants/stock-log-type.enum';

export interface StockInResult {
  stockLogId: number;
  variantId: number;
  productName: string;
  quantityAdded: number;
  oldStock: { quantity: number; remaining: number };
  newStock: { quantity: number; remaining: number };
}

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockLog)
    private stockLogRepository: Repository<StockLog>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    private dataSource: DataSource,
  ) {}

  async createStockIn(createStockInDto: CreateStockInDto, userId?: number) {
    return await this.dataSource.transaction(async (manager) => {
      const { items, note } = createStockInDto;
      const results: StockInResult[] = [];

      for (const item of items) {
        const { variantId, quantity } = item;

        // Find variant
        const variant = await manager.findOne(ProductVariant, {
          where: { id: variantId },
          relations: ['product'],
        });

        if (!variant) {throw new HttpException(`Variant ID ${variantId} not found`, HttpStatus.NOT_FOUND)}

        // Store old values for audit
        const oldQuantity = variant.quantity;
        const oldRemaining = variant.remaining;

        // Increase stock
        variant.quantity += quantity;
        variant.remaining += quantity;
        await manager.save(ProductVariant, variant);

        // Create stock log (immutable audit record)
        const finalNote =
          note || `Import ${quantity} products ${variant.product.name}`;

        const stockLog = manager.create(StockLog, {
          variant,
          quantity,
          type: StockLogType.IN,
          note: finalNote,
          ...(userId && { createdBy: { id: userId } as any }),
        });

        const savedLog = await manager.save(StockLog, stockLog);

        results.push({
          stockLogId: savedLog.id,
          variantId: variant.id,
          productName: variant.product.name,
          quantityAdded: quantity,
          oldStock: {
            quantity: oldQuantity,
            remaining: oldRemaining,
          },
          newStock: {
            quantity: variant.quantity,
            remaining: variant.remaining,
          },
        });
      }

      return {
        message: `Successfully imported stock for ${items.length} variant(s)`,
        data: results,
      };
    });
  }

  /**
   * Create stock out (export inventory)
   * Called when order is confirmed - decreases only remaining
   * quantity stays the same (total inventory doesn't change)
   * This method is called internally by OrdersService
   */
  async createStockOut(
    variantId: number,
    quantity: number,
    note: string,
    userId?: number,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // Find variant
      const variant = await manager.findOne(ProductVariant, {
        where: { id: variantId },
        relations: ['product'],
      });

      if (!variant) {
        throw new HttpException(
          `Variant ID ${variantId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check stock availability
      if (quantity > variant.remaining) {
        throw new HttpException(
          `Not enough stock for ${variant.product.name}. Available: ${variant.remaining}, Requested: ${quantity}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Store old value for audit
      const oldRemaining = variant.remaining;

      // Decrease remaining stock (quantity unchanged)
      variant.remaining -= quantity;
      await manager.save(ProductVariant, variant);

      // Create immutable stock log
      const stockLog = manager.create(StockLog, {
        variant,
        quantity,
        type: StockLogType.OUT,
        note,
        ...(userId && { createdBy: { id: userId } as any }),
      });

      const savedLog = await manager.save(StockLog, stockLog);

      return {
        stockLogId: savedLog.id,
        variantId: variant.id,
        productName: variant.product.name,
        quantityDeducted: quantity,
        oldRemaining,
        newRemaining: variant.remaining,
      };
    });
  }

  /**
   * Helper method to log stock out without modifying variant
   * Used by OrdersService which handles stock reduction in its own transaction
   * @param manager - EntityManager from parent transaction
   * @param variant - ProductVariant entity (already loaded with product relation)
   * @param quantity - Quantity being deducted
   * @param note - Description of the stock out
   * @param userId - Optional user ID who triggered this action
   */
  async logStockOut(
    manager: EntityManager,
    variant: ProductVariant,
    quantity: number,
    note: string,
    userId?: number,
  ): Promise<StockLog> {
    const stockLog = manager.create(StockLog, {
      variant,
      quantity,
      type: StockLogType.OUT,
      note,
      ...(userId && { createdBy: { id: userId } as any }),
    });

    return await manager.save(StockLog, stockLog);
  }

  /**
   * Helper method to log stock in without modifying variant
   * Used when restoring stock (cancel order, return)
   * @param manager - EntityManager from parent transaction
   * @param variant - ProductVariant entity (already loaded with product relation)
   * @param quantity - Quantity being added back
   * @param note - Description of the stock in
   * @param userId - Optional user ID who triggered this action
   */
  async logStockIn(
    manager: EntityManager,
    variant: ProductVariant,
    quantity: number,
    note: string,
    userId?: number,
  ): Promise<StockLog> {
    const stockLog = manager.create(StockLog, {
      variant,
      quantity,
      type: StockLogType.IN,
      note,
      ...(userId && { createdBy: { id: userId } as any }),
    });

    return await manager.save(StockLog, stockLog);
  }

  /**
   * Get all stock logs with filtering and pagination
   * Supports filtering by type (IN/OUT) and variantId
   */
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
      .leftJoinAndSelect('stock_log.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('stock_log.createdBy', 'user')
      .select([
        'stock_log',
        'variant.id',
        'variant.quantity',
        'variant.remaining',
        'product.id',
        'product.name',
        'user.id',
        'user.fullName',
        'user.email',
      ]);

    // Filter by type
    if (type) {
      queryBuilder.andWhere('stock_log.type = :type', { type });
    }

    // Filter by variantId
    if (variantId) {
      queryBuilder.andWhere('variant.id = :variantId', { variantId });
    }

    // Sorting
    queryBuilder.orderBy(`stock_log.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get stock logs by variant ID
   */
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

    const logs = await this.getStockLogs({
      ...query,
      variantId,
    });

    return {
      variant: {
        id: variant.id,
        quantity: variant.quantity,
        remaining: variant.remaining,
        productName: variant.product.name,
      },
      ...logs,
    };
  }

  /**
   * Get stock summary for a variant
   * Shows current stock status and historical totals
   */
  async getStockSummary(variantId: number) {
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

    // Get total in/out from logs
    const totalIn = await this.stockLogRepository
      .createQueryBuilder('stock_log')
      .leftJoin('stock_log.variant', 'variant')
      .where('variant.id = :variantId', { variantId })
      .andWhere('stock_log.type = :type', { type: StockLogType.IN })
      .select('SUM(stock_log.quantity)', 'total')
      .getRawOne();

    const totalOut = await this.stockLogRepository
      .createQueryBuilder('stock_log')
      .leftJoin('stock_log.variant', 'variant')
      .where('variant.id = :variantId', { variantId })
      .andWhere('stock_log.type = :type', { type: StockLogType.OUT })
      .select('SUM(stock_log.quantity)', 'total')
      .getRawOne();

    return {
      variant: {
        id: variant.id,
        productName: variant.product.name,
      },
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
}
