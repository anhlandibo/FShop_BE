import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { CouponTarget } from './entities/coupon-target.entity';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponTarget) private readonly couponTargetRepository: Repository<CouponTarget>,
    @InjectRepository(CouponRedemption) private readonly couponRedemptionRepository: Repository<CouponRedemption>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    return await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Coupon, { where: { code: createCouponDto.code } });
      if (existing) throw new HttpException('Coupon code already exists', HttpStatus.BAD_REQUEST);

      const coupon = manager.create(Coupon, {
        ...createCouponDto,
        startDate: new Date(createCouponDto.startDate),
        endDate: new Date(createCouponDto.endDate),
      });
      const savedCoupon = await manager.save(coupon);

      // Check có targets hay không
      if (createCouponDto.targets && createCouponDto.targets.length > 0) {
        const targets = createCouponDto.targets.map(target => manager.create(CouponTarget, { ...target, coupon: savedCoupon }));
        await manager.save(targets);
        savedCoupon.targets = targets;
      }

      return savedCoupon;
    })
  }

  async getAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const [data, total] = await this.couponRepository.findAndCount({
      where: search
        ? [{ name : Like(`%${search}%`) }, { description: Like(`%${search}%`) }]
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
    return await this.couponRepository.findOne({ where: { id }, relations: ['targets', 'redemptions'] });
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
        const exists = await manager.findOne(Coupon, { where: { code: updateCouponDto.code } });
        if (exists) {
          throw new HttpException(`Coupon code "${updateCouponDto.code}" already exists`, HttpStatus.BAD_REQUEST);
        }
        coupon.code = updateCouponDto.code;
      }

      // update fields cơ bản
      Object.assign(coupon, {
        ...updateCouponDto,
        ...(updateCouponDto.startDate && { startDate: new Date(updateCouponDto.startDate) }),
        ...(updateCouponDto.endDate && { endDate: new Date(updateCouponDto.endDate) }),
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
    })
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const coupon = await manager.findOne(Coupon, { where: { id } });
      if (!coupon) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);

      await manager.delete(Coupon, coupon);
      return { deletedId: id };
    });
  }

}
