/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { CouponTarget } from './entities/coupon-target.entity';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponStatus, DiscountType, TargetType } from 'src/constants';
import { ProductVariant } from '../products/entities';
import { Cart } from '../carts/entities';
import { User } from '../users/entities/user.entity';
import { MyCouponsQueryDto } from './dto/my-coupons-query.dto';

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

  async apply(code: string, orderId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      console.log(userId)
      const validation = await this.validate(code, userId);
      if (!validation.valid) throw new HttpException("Coupon not valid", HttpStatus.BAD_REQUEST);

      const coupon = await manager.findOne(Coupon, {where: { code }, relations: ['targets']});
      if (!coupon) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);

      // check coupon co apply cho order chua
      const existed = await manager.findOne(CouponRedemption, {
        where: { coupon: {id: coupon.id}, order: { id: orderId }, user: { id: userId } },
      })
      if (existed) throw new HttpException('Coupon already applied', HttpStatus.BAD_REQUEST);

      const redemption = manager.create(CouponRedemption, {
        coupon,
        user: { id: userId },
        order: { id: orderId },
        isRedeemed: false,
        appliedAt: new Date(),
      })
      await manager.save(CouponRedemption, redemption);

      return {
        applied: true,
        code: coupon.code,
        discountAmount: validation.discountAmount,
        totalAmount: validation.totalAmount,
        applicableItemsCount: validation.applicableItemsCount,
        message: `Coupon ${coupon.code} applied successfully.`,
      };
    })
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
    const { page, limit, search, sortBy = 'appliedAt', sortOrder = 'DESC', discountType } = query;

    const queryBuilder = this.couponRedemptionRepository
      .createQueryBuilder('redemption')
      .leftJoinAndSelect('redemption.coupon', 'coupon')
      .leftJoinAndSelect('redemption.order', 'order')
      .where('redemption.userId = :userId', { userId });

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
    if (sortBy === 'appliedAt' || sortBy === 'redeemedAt') {
      queryBuilder.orderBy(`redemption.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy(`coupon.${sortBy}`, sortOrder);
    }

    // Pagination
    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    const [redemptions, total] = await queryBuilder.getManyAndCount();

    const data = redemptions.map(redemption => ({
      id: redemption.id,
      coupon: redemption.coupon,
      orderId: redemption.order?.id,
      isRedeemed: redemption.isRedeemed,
      appliedAt: redemption.appliedAt,
      redeemedAt: redemption.redeemedAt,
    }));

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
  }
}
