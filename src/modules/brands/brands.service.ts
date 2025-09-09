import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { DataSource, In, Like, Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CreateBrandDto } from './dto/create-brand.dto';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { DeleteBrandsDto } from './dto/delete-brands.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    const alreadyExist = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
    });
    if (alreadyExist) {
      throw new HttpException('Brand already exist', HttpStatus.CONFLICT);
    }
    return this.brandRepository.save(
      this.brandRepository.create(createBrandDto),
    );
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const redisKey = hashKey('brands', query);
    const cachedData: string | null = await this.redis.get(redisKey);
    if (cachedData) {
      console.log('data lay tu redis');
      return JSON.parse(cachedData) as {
        pagination: {
          total: number;
          page: number | undefined;
          limit: number | undefined;
        };
        data: Brand[];
      };
    }
    const [data, total] = await this.brandRepository.findAndCount({
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
    await this.redis.set(redisKey, JSON.stringify(response), 'EX', 60);
    return response;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
    }
    return await this.brandRepository.update(id, updateBrandDto);
  }

  async delete(id: number) {
    const result = await this.brandRepository.update(id, { isActive: false });

    if (result.affected === 0) {
      throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Brand soft deleted successfully',
      deletedId: id,
    };
  }

  async deleteMany(deleteBrandsDto: DeleteBrandsDto) {
    const { ids } = deleteBrandsDto;

    return await this.dataSource.transaction(async (manager) => {
      const brands = await manager.find(Brand, {
        where: { id: In(ids) },
      });

      if (!brands || brands.length === 0) {
        throw new HttpException('Not found any brands', HttpStatus.NOT_FOUND);
      }

      await manager.update(Brand, {id: In(ids)}, { isActive: false });

      return { deletedIds: ids };
    })
  }
  
}
