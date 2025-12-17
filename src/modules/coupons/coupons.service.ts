/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Like, Repository } from 'typeorm';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { CouponTarget } from './entities/coupon-target.entity';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponStatus, DiscountType, NotificationType, TargetType } from 'src/constants';
import { ProductVariant } from '../products/entities';
import { Cart } from '../carts/entities';
import { MyCouponsQueryDto } from './dto/my-coupons-query.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponTarget)
    private readonly couponTargetRepository: Repository<CouponTarget>,
    @InjectRepository(CouponRedemption)
    private readonly couponRedemptionRepository: Repository<CouponRedemption>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notiService: NotificationsService
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    return await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Coupon, {
        where: { code: createCouponDto.code },
      });
      if (existing) throw new HttpException('Coupon code already exists',HttpStatus.BAD_REQUEST); 
        
      const coupon = manager.create(Coupon, {
        ...createCouponDto,
        startDate: new Date(createCouponDto.startDate),
        endDate: new Date(createCouponDto.endDate),
      });
      const savedCoupon = await manager.save(coupon);

      // Check có targets hay không
      if (createCouponDto.targets && createCouponDto.targets.length > 0) {
        const targets = createCouponDto.targets.map((target) =>
          manager.create(CouponTarget, { ...target, coupon: savedCoupon }),
        );
        await manager.save(targets);
        savedCoupon.targets = targets;
      }

      let isSiteWide = true; // Cờ kiểm tra xem có phải sale toàn sàn

      if (createCouponDto.targets && createCouponDto.targets.length > 0) {
        if (!createCouponDto.targets.some(t => t.targetType === TargetType.ALL)) {
            isSiteWide = false;
        }

        const targets = createCouponDto.targets.map((target) =>
          manager.create(CouponTarget, { ...target, coupon: savedCoupon }),
        );
        await manager.save(targets);
        savedCoupon.targets = targets;
      }

      
      let title = 'Coupon Code Released!';
      let message = `Apply CODE "${savedCoupon.code}" to get discount ${savedCoupon.name || ''}.`;

      if (isSiteWide) {
          title = 'Super Sale For ALL!';
          message = `Big Deal! CODE "${savedCoupon.code}" is now available for all products.`;
      } else {
          title = 'Sale For Selected!';
          message = `CODE "${savedCoupon.code}" is now available for selected products.`;
      }

      // Gửi Broadcast (Socket + DB)
      this.notiService.sendToAll(title, message, NotificationType.DISCOUNT).catch(err => {
          console.error('Failed to broadcast coupon notification:', err);
      });

      return savedCoupon;
    });
  }

  async getAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const [data, total] = await this.couponRepository.findAndCount({
      where: search
        ? [{ name: Like(`%${search}%`) }, { description: Like(`%${search}%`) }]
        : {},
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

  async getById(id: number) {
    return await this.couponRepository.findOne({
      where: { id },
      relations: ['targets', 'redemptions'],
    });
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    return await this.dataSource.transaction(async (manager) => {
      const coupon = await manager.findOne(Coupon, {
        where: { id },
        relations: ['targets'],
      });
      if (!coupon) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);

      // check code trùng
      if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
        const exists = await manager.findOne(Coupon, {
          where: { code: updateCouponDto.code },
        });
        if (exists) 
          throw new HttpException(`Coupon code "${updateCouponDto.code}" already exists`, HttpStatus.BAD_REQUEST);
        coupon.code = updateCouponDto.code;
      }

      // update fields cơ bản
      Object.assign(coupon, {
        ...updateCouponDto,
        ...(updateCouponDto.startDate && {
          startDate: new Date(updateCouponDto.startDate),
        }),
        ...(updateCouponDto.endDate && {
          endDate: new Date(updateCouponDto.endDate),
        }),
      });

      if (updateCouponDto.targets) {
        await manager.delete(CouponTarget, { coupon: { id: coupon.id } });
        // Thêm mới
        const newTargets = updateCouponDto.targets.map((t) =>
          manager.create(CouponTarget, { ...t, coupon }),
        );
        coupon.targets = await manager.save(CouponTarget, newTargets);
      }
      return await manager.save(Coupon, coupon);
    });
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const coupon = await manager.findOne(Coupon, { where: { id } });
      if (!coupon)
        throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);

      await manager.delete(Coupon, coupon);
      return { deletedId: id };
    });
  }

  async validate(code: string, userId: number) {
    const now = new Date();

    // tìm coupon
    const coupon = await this.couponRepository.findOne({
      where: { code },
      relations: ['targets'],
    });
    if (!coupon) return { valid: false, reason: 'Coupon not found' };

    // Tải giỏ hàng và các item kèm variant + product + category
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.category',
      ],
    });
    if (!cart || !cart.items.length)
      return { valid: false, reason: 'Your cart is empty' };

    // Kiểm tra trạng thái / thời gian
    if (coupon.status !== CouponStatus.ACTIVE) return { valid: false, reason: 'Coupon is not active' };
    if (now < coupon.startDate) return { valid: false, reason: 'Coupon has not started yet' };
    if (now > coupon.endDate) return { valid: false, reason: 'Coupon has expired' };
      
    //  Giới hạn số lượt
    const [totalUsed, usedByUser] = await Promise.all([
      this.couponRedemptionRepository.count({ where: { coupon: { id: coupon.id } } }),
      this.couponRedemptionRepository.count({ where: { coupon: { id: coupon.id }, user: { id: userId } } })
    ]);
    if (coupon.usageLimit && totalUsed >= coupon.usageLimit)
      return { valid: false, reason: 'Coupon usage limit reached' };
    if (coupon.usageLimitPerUser && usedByUser >= coupon.usageLimitPerUser)
      return { valid: false, reason: 'User already used this coupon' };

     // Tính tổng đơn hàng từ giỏ
    const totalAmount = cart.items.reduce((sum, item) => {
      const productPrice = Number(item.variant.product.price);
      return sum + productPrice * item.quantity;
    }, 0);

    if (coupon.minOrderAmount && totalAmount < Number(coupon.minOrderAmount))
      return { valid: false, reason: 'Minimum order amount not reached' };
    
    //  Xác định item áp dụng
      const allTarget = coupon.targets?.some(t => t.targetType === TargetType.ALL);
    const applicableItems = allTarget
      ? cart.items
      : cart.items.filter(item => {
          const p = item.variant.product;
          const c = p.category;
          return coupon.targets?.some(t =>
            (t.targetType === TargetType.PRODUCT && t.targetId === p.id) ||
            (t.targetType === TargetType.CATEGORY && t.targetId === c?.id)
          );
        });

    if (!applicableItems.length)
      return { valid: false, reason: 'Coupon not applicable to any items in cart' };
  
    // discount logic
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      for (const item of applicableItems) {
        discountAmount += Number(item.variant.product.price) * item.quantity * (Number(coupon.discountValue) / 100);
      }
    } 
    else if (coupon.discountType === DiscountType.FIXED_AMOUNT) 
      discountAmount = Number(coupon.discountValue || 0);
    else if (coupon.discountType === DiscountType.FREE_SHIPPING) 
      discountAmount = 30000;
    

    if (discountAmount > totalAmount) discountAmount = totalAmount;

    // Trả kết quả
    return {
      valid: true,
      discountAmount,
      applicableItemsCount: applicableItems.length,
      totalAmount,
    };
  }  

  async calculateDiscount(
    code: string,
    userId: number,
    orderItems: Array<{ variantId: number; quantity: number; price: number; product: any; category?: any }>,
    shippingFee: number,
  ) {
    const now = new Date();

    // 1. Find coupon
    const coupon = await this.couponRepository.findOne({
      where: { code },
      relations: ['targets'],
    });
    if (!coupon) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);

    // 2. Validate basic conditions
    if (coupon.status !== CouponStatus.ACTIVE)
      throw new HttpException('Coupon is not active', HttpStatus.BAD_REQUEST);
    if (now < coupon.startDate)
      throw new HttpException('Coupon has not started yet', HttpStatus.BAD_REQUEST);
    if (now > coupon.endDate)
      throw new HttpException('Coupon has expired', HttpStatus.BAD_REQUEST);

    // 3. Check usage limits
    const [totalUsed, usedByUser] = await Promise.all([
      this.couponRedemptionRepository.count({ where: { coupon: { id: coupon.id }, isRedeemed: true } }),
      this.couponRedemptionRepository.count({ where: { coupon: { id: coupon.id }, user: { id: userId }, isRedeemed: true } }),
    ]);
    if (coupon.usageLimit && totalUsed >= coupon.usageLimit)
      throw new HttpException('Coupon usage limit reached', HttpStatus.BAD_REQUEST);
    if (coupon.usageLimitPerUser && usedByUser >= coupon.usageLimitPerUser)
      throw new HttpException('You have already used this coupon', HttpStatus.BAD_REQUEST);

    // 4. Determine applicable items based on targets
    const allTarget = coupon.targets?.some((t) => t.targetType === TargetType.ALL);
    const applicableItems = allTarget
      ? orderItems
      : orderItems.filter((item) => {
          return coupon.targets?.some(
            (t) =>
              (t.targetType === TargetType.PRODUCT && t.targetId === item.product.id) ||
              (t.targetType === TargetType.CATEGORY && t.targetId === item.category?.id),
          );
        });

    if (!applicableItems.length)
      throw new HttpException('Coupon not applicable to any items in this order', HttpStatus.BAD_REQUEST);

    // 5. Calculate subtotal of applicable items
    const applicableSubtotal = applicableItems.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    // 6. Calculate total order amount
    const orderSubtotal = orderItems.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    // 7. Check minimum order amount (based on total order, not just applicable items)
    if (coupon.minOrderAmount && orderSubtotal < Number(coupon.minOrderAmount))
      throw new HttpException(
        `Minimum order amount of ${coupon.minOrderAmount} not reached. Current: ${orderSubtotal}`,
        HttpStatus.BAD_REQUEST,
      );

    // 8. Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      // Percentage discount applies to applicable items only
      discountAmount = applicableSubtotal * (Number(coupon.discountValue) / 100);
    } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      // Fixed discount
      discountAmount = Number(coupon.discountValue || 0);
    } else if (coupon.discountType === DiscountType.FREE_SHIPPING) {
      // Free shipping - discount equals shipping fee
      discountAmount = shippingFee;
    }

    // 9. Cap discount at order subtotal + shipping fee
    const maxDiscount = orderSubtotal + shippingFee;
    if (discountAmount > maxDiscount) discountAmount = maxDiscount;

    return {
      discountAmount: Math.round(discountAmount),
      applicableItemsCount: applicableItems.length,
      couponId: coupon.id,
    };
  }

  async apply(code: string, orderId: number, userId: number, transactionManager?: EntityManager) {
    const execute = async (manager: EntityManager) => {
      // 1. Find coupon
      const coupon = await manager.findOne(Coupon, { where: { code }, relations: ['targets'] });
      if (!coupon) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);

      // 2. Check if already applied
      const existed = await manager.findOne(CouponRedemption, {
        where: { coupon: { id: coupon.id }, order: { id: orderId }, user: { id: userId } },
      });
      if (existed) throw new HttpException('Coupon already applied to this order', HttpStatus.BAD_REQUEST);

      // 3. Create redemption record
      const redemption = manager.create(CouponRedemption, {
        coupon,
        user: { id: userId },
        order: { id: orderId },
        isRedeemed: false,
        appliedAt: new Date(),
      });

      await manager.save(CouponRedemption, redemption);

      return {
        applied: true,
        code: coupon.code,
        message: `Coupon ${coupon.code} applied successfully.`,
      };
    };

    // Use provided transaction manager or create new one
    if (transactionManager) {
      return await execute(transactionManager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async redeem(code: string, orderId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const redemption = await manager.findOne(CouponRedemption, {
        where: { coupon: { code }, order: { id: orderId }, user: { id: userId } },
        relations: ['coupon']
      })
      if (!redemption) throw new HttpException('Coupon not applied or invalid order', HttpStatus.NOT_FOUND);
      if (redemption.isRedeemed) throw new HttpException('Coupon already redeemed', HttpStatus.BAD_REQUEST);

      const coupon = redemption.coupon;
      const now = new Date();
      if (now > coupon.endDate)
        throw new HttpException('Coupon expired before redemption', HttpStatus.BAD_REQUEST);

      if (coupon.status !== CouponStatus.ACTIVE)
        throw new HttpException('Coupon is not active', HttpStatus.BAD_REQUEST);

      redemption.isRedeemed = true;
      redemption.redeemedAt = new Date();
      await manager.save(CouponRedemption, redemption);

      coupon.usageCount = (coupon.usageCount || 0) + 1;
      await manager.save(Coupon, coupon);

      return {
        redeemed: true,
        code: coupon.code,
        redeemedAt: redemption.redeemedAt,
        message: `Coupon ${coupon.code} successfully redeemed for order #${orderId}`,
      };
    })
  }

  async getMyCoupons(userId: number, query: MyCouponsQueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC', discountType } = query;
    const now = new Date();

    // Lấy tất cả coupons đang active và chưa hết hạn
    const queryBuilder = this.couponRepository
      .createQueryBuilder('coupon')
      .where('coupon.status = :status', { status: CouponStatus.ACTIVE })
      .andWhere('coupon.endDate > :now', { now })
      .andWhere('coupon.startDate <= :now', { now });

    // Filter by discount type
    if (discountType) {
      queryBuilder.andWhere('coupon.discountType = :discountType', { discountType });
    }

    // Search by coupon code or name
    if (search) {
      queryBuilder.andWhere(
        '(coupon.code LIKE :search OR coupon.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Sorting
    queryBuilder.orderBy(`coupon.${sortBy}`, sortOrder);

    // Pagination
    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    const coupons = await queryBuilder.getMany();

    // Với mỗi coupon, kiểm tra xem user đã dùng bao nhiêu lần
    const data: any[] = [];
    for (const coupon of coupons) {
      const usedCount = await this.couponRedemptionRepository.count({
        where: {
          coupon: { id: coupon.id },
          user: { id: userId },
          isRedeemed: true,
        },
      });
      
      const canUse = !coupon.usageLimitPerUser || usedCount < coupon.usageLimitPerUser;

      if (canUse) {
        data.push({
          ...coupon,
          usedCount,
          remainingUses: coupon.usageLimitPerUser ? coupon.usageLimitPerUser - usedCount : null,
        });
      }
    }

    return {
      pagination: {
        total: data.length,
        page,
        limit,
      },
      data,
    };
  }

  async getApplicableCouponsForCheckout(
    userId: number,
    items: Array<{ variantId: number; quantity: number }>
  ) {
    const now = new Date();

    // 1. Validate input
    if (!items || items.length === 0) {
      return {
        total: 0,
        cartTotal: 0,
        data: [],
      };
    }

    // 2. Lấy tất cả variants với relations product và category
    const variantIds = items.map(item => item.variantId);
    const variants = await this.productVariantRepository.find({
      where: { id: In(variantIds) },
      relations: ['product', 'product.category'],
    });

    // 3. Tạo map để tra cứu nhanh variant theo ID
    const variantMap = new Map(variants.map(v => [v.id, v]));

    // 4. Tính tổng giỏ hàng và validate items
    let cartTotal = 0;
    const validItems: Array<{
      variant: any;
      quantity: number;
      productId: number;
      categoryId: number | undefined;
      price: number;
    }> = [];

    for (const item of items) {
      const variant = variantMap.get(item.variantId);
      if (!variant || !variant.product) {
        // Skip invalid variants
        continue;
      }

      const price = Number(variant.product.price);
      cartTotal += price * item.quantity;

      validItems.push({
        variant,
        quantity: item.quantity,
        productId: variant.product.id,
        categoryId: variant.product.category?.id,
        price,
      });
    }

    if (validItems.length === 0) {
      return {
        total: 0,
        cartTotal: 0,
        data: [],
      };
    }

    // 5. Lấy danh sách product IDs và category IDs
    const productIdsInCart = new Set(validItems.map(i => i.productId));
    const categoryIdsInCart = new Set(
      validItems.map(i => i.categoryId).filter((id): id is number => id !== undefined)
    );

    // 4. Query tất cả coupons đang active và trong thời gian hiệu lực
    const coupons = await this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.targets', 'target')
      .where('coupon.status = :status', { status: CouponStatus.ACTIVE })
      .andWhere('coupon.startDate <= :now', { now })
      .andWhere('coupon.endDate >= :now', { now })
      // Fix logic: usageLimit = 0 nghĩa là không giới hạn, NULL cũng vậy
      .andWhere(
        '(coupon.usageLimit IS NULL OR coupon.usageLimit = 0 OR (coupon.usageCount IS NOT NULL AND coupon.usageCount < coupon.usageLimit))'
      )
      .getMany();

    // 5. Lấy usage count của user cho TẤT CẢ coupons trong 1 query (thay vì N queries)
    const couponIds = coupons.map(c => c.id);
    const userRedemptions = await this.couponRedemptionRepository
      .createQueryBuilder('redemption')
      .select('redemption.couponId', 'couponId')
      .addSelect('COUNT(*)', 'count')
      .where('redemption.userId = :userId', { userId })
      .andWhere('redemption.couponId IN (:...couponIds)', { couponIds })
      .andWhere('redemption.isRedeemed = :isRedeemed', { isRedeemed: true })
      .groupBy('redemption.couponId')
      .getRawMany();

    // 6. Tạo map để tra cứu nhanh user usage count
    const userUsageMap = new Map<number, number>();
    userRedemptions.forEach((r: any) => {
      userUsageMap.set(Number(r.couponId), Number(r.count));
    });

    // 7. Filter và tính discount cho từng coupon
    const applicableCoupons: Array<{
      id: number;
      code: string;
      name: string;
      description: string;
      discountType: DiscountType;
      discountValue: number;
      minOrderAmount: number;
      startDate: Date;
      endDate: Date;
      previewDiscount: number;
      canApply: boolean;
      usageLimitPerUser: number;
      userUsedCount: number;
    }> = [];

    for (const coupon of coupons) {
      // Check usageLimitPerUser
      if (coupon.usageLimitPerUser) {
        const userUsageCount = userUsageMap.get(coupon.id) || 0;
        if (userUsageCount >= coupon.usageLimitPerUser) continue;
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && cartTotal < Number(coupon.minOrderAmount)) {
        continue;
      }

      // Check target validity
      const targets = coupon.targets || [];
      const hasAllTarget = targets.length === 0 || targets.some(t => t.targetType === TargetType.ALL);

      let isTargetValid = false;
      if (hasAllTarget) {
        isTargetValid = true;
      } else {
        const hasProductMatch = targets.some(
          t => t.targetType === TargetType.PRODUCT && t.targetId !== null && productIdsInCart.has(t.targetId)
        );
        const hasCategoryMatch = targets.some(
          t => t.targetType === TargetType.CATEGORY && t.targetId !== null && categoryIdsInCart.has(t.targetId)
        );
        isTargetValid = hasProductMatch || hasCategoryMatch;
      }

      if (!isTargetValid) continue;

      // Calculate estimated discount
      const applicableItems = hasAllTarget
        ? validItems
        : validItems.filter(item => {
            const pId = item.productId;
            const cId = item.categoryId;
            return targets.some(
              t =>
                (t.targetType === TargetType.PRODUCT && t.targetId !== null && t.targetId === pId) ||
                (t.targetType === TargetType.CATEGORY && t.targetId !== null && cId !== undefined && t.targetId === cId)
            );
          });

      let estimatedDiscount = 0;

      if (coupon.discountType === DiscountType.PERCENTAGE) {
        const applicableSubtotal = applicableItems.reduce(
          (sum: number, item) => sum + item.price * item.quantity,
          0
        );
        estimatedDiscount = applicableSubtotal * (Number(coupon.discountValue) / 100);
      } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
        estimatedDiscount = Number(coupon.discountValue);
      } else if (coupon.discountType === DiscountType.FREE_SHIPPING) {
        estimatedDiscount = 30000; // Fixed shipping fee
      }

      // Cap discount at cart total
      if (estimatedDiscount > cartTotal) {
        estimatedDiscount = cartTotal;
      }

      applicableCoupons.push({
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        previewDiscount: Math.round(estimatedDiscount),
        canApply: true,
        usageLimitPerUser: coupon.usageLimitPerUser,
        userUsedCount: userUsageMap.get(coupon.id) || 0,
      });
    }

    // 8. Sắp xếp: Ưu tiên giảm giá nhiều nhất lên đầu
    applicableCoupons.sort((a, b) => b.previewDiscount - a.previewDiscount);

    return {
      total: applicableCoupons.length,
      cartTotal,
      data: applicableCoupons,
    };
  }
}
