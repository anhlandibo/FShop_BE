import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, DataSource, Like, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { create } from 'domain';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { User } from '../users/entities/user.entity';
import { DeleteCategoriesDto } from './dto/delete-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const alreadyExist = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });
    if (alreadyExist) {
      throw new HttpException('Category already exist', HttpStatus.CONFLICT);
    }

    let parentExist: Category | null = null;
    if (createCategoryDto.parentId) {
      parentExist = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (!parentExist) {
        throw new HttpException(
          'Parent category not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      ...(parentExist ? { parent: parentExist } : {}),
    });

    return this.categoryRepository.save(category);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    let parentExist: Category | null = null;
    if (updateCategoryDto.parentId) {
      parentExist = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });
      if (!parentExist) {
        throw new HttpException(
          'Parent category not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (parentExist.id === id) {
        throw new HttpException(
          'Category cannot be its own parent',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return await this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'], // cần load quan hệ
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    if (category.children && category.children.length > 0) {
      throw new HttpException(
        'Category cannot be deleted because it has children',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.categoryRepository.delete(id);

    return {
      message: 'Category deleted successfully',
      id,
    };
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const redisKey = hashKey('categories', query);
    const cachedData: string | null = await this.redis.get(redisKey)
    if (cachedData) {
      console.log("data lay tu redis")
      return JSON.parse(cachedData) as {
        pagination: {
          total: number;
          page: number | undefined;
          limit: number | undefined;
        };
        data: Category[];
      }
    }
    const [data, total] = await this.categoryRepository.findAndCount({
      where: search
        ? [
          { name: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ]
        : {},
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
    });
    const response = {
      pagination: {
        total,
        page,
        limit
      },
      data
    };
    console.log("data lay tu DB")
    await this.redis.set(redisKey, JSON.stringify(response), 'EX', 60)
    return response
  }

  async removeMultiple(deleteCategoriesDto: DeleteCategoriesDto) {
    const { ids } = deleteCategoriesDto;
    return await this.dataSource.transaction(async (manager) => {
      const categories = await manager.find(Category, {
        where: { id: In(ids) },
      });

      if (!categories || categories.length === 0) {
        throw new HttpException('Not found any categories', HttpStatus.NOT_FOUND);
      }

      await manager.delete(Category, ids);

      return { deletedIds: ids };
    });
  }
}
