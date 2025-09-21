/* eslint-disable no-prototype-builtins */
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, DataSource, Like, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoriesDto } from './dto';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      if (
        await manager.findOne(Category, {
          where: { name: createCategoryDto.name },
        })
      )
        throw new HttpException('Category already exist', HttpStatus.CONFLICT);
      const department = await manager.findOne(Department, {
        where: { id: createCategoryDto.departmentId },
      });
      if (!department)
        throw new HttpException('Department not found', HttpStatus.NOT_FOUND);

      // Upload ảnh
      let imageUrl: string | undefined;
      let publicId: string | undefined;

      if (file) {
        const uploaded = await this.cloudinaryService.uploadFile(file);
        imageUrl = uploaded?.secure_url;
        publicId = uploaded?.public_id;
      }

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        department,
        imageUrl,
        publicId,
      });
      await manager.save(category);
      return category;
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file: Express.Multer.File,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, { where: { id } });
      if (!category)
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      const department = await manager.findOne(Department, {
        where: { id: updateCategoryDto.departmentId },
      });
      if (!department)
        throw new HttpException('Department not found', HttpStatus.NOT_FOUND);

      Object.assign(category, updateCategoryDto); // merge
      category.department = department;

      // upload ảnh
      if (file) {
        if (category.publicId)
          await this.cloudinaryService
            .deleteFile(category.publicId)
            .catch(() => null);
        const uploaded = await this.cloudinaryService.uploadFile(file);
        category.imageUrl = uploaded?.secure_url;
        category.publicId = uploaded?.public_id;
      }
      return await manager.save(category);
    });
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, { where: { id } });
      if (!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

      if (category.publicId) await this.cloudinaryService.deleteFile(category.publicId).catch(() => null);

      await manager.update(Category, id, { isActive: false });
      return {
        message: 'Category disabled successfully',
        deletedId: id,
      };
    });
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const redisKey = hashKey('categories', query);
    const cachedData: string | null = await this.redis.get(redisKey);
    if (cachedData) {
      console.log('data lay tu redis');
      return JSON.parse(cachedData) as {
        pagination: {
          total: number;
          page: number | undefined;
          limit: number | undefined;
        };
        data: Category[];
      };
    }
    const [data, total] = await this.categoryRepository.findAndCount({
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

  async getById(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    return category;
  }

  async removeMultiple(deleteCategoriesDto: DeleteCategoriesDto) {
    const { ids } = deleteCategoriesDto;
    return await this.dataSource.transaction(async (manager) => {
      const categories = await manager.find(Category, {
        where: { id: In(ids) },
      });

      if (!categories || categories.length === 0) {
        throw new HttpException(
          'Not found any categories',
          HttpStatus.NOT_FOUND,
        );
      }

      await manager.remove(categories);

      return { deletedIds: ids };
    });
  }
}
