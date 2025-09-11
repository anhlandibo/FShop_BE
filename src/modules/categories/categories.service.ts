/* eslint-disable no-prototype-builtins */
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, DataSource, Like, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { DeleteCategoriesDto } from './dto/delete-categories.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file?: Express.Multer.File,
  ) {
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
      if (parentExist.parentId !== null) {
        throw new HttpException(
          'Cannot create a grandchild category. Maximum two levels of hierarchy are allowed.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let imageUrl: string | undefined;
    let publicId: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file);
      imageUrl = uploaded?.secure_url;
      publicId = uploaded?.public_id;
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      imageUrl,
      publicId,
      ...(parentExist ? { parent: parentExist } : {}),
    });

    return this.categoryRepository.save(category);
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }
    
    if (updateCategoryDto.parentId !== null){
      const parentExist = await this.categoryRepository.findOne({
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
        if (parentExist.parentId !== null) {
          throw new HttpException(
            'Cannot create a grandchild category. Maximum two levels of hierarchy are allowed.',
            HttpStatus.BAD_REQUEST,
          );
        }
        category.parentId = parentExist.id;
    }

    Object.assign(category, updateCategoryDto);

    // Upload ảnh
    if (file) {
      if (category.publicId) {
        await this.cloudinaryService
          .deleteFile(category.publicId)
          .catch(() => null);
      }
      const uploaded = await this.cloudinaryService.uploadFile(file);
      category.imageUrl = uploaded?.secure_url;
      category.publicId = uploaded?.public_id;
    }

    return await this.categoryRepository.update(id, category);
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

    await this.categoryRepository.update(id, { isActive: false });

    return {
      message: 'Category deleted successfully',
      deleteId: id,
    };
  }

  @UseGuards()
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

      await manager.update(Category, { id: In(ids) }, { isActive: false });

      return { deletedIds: ids };
    });
  }
}
