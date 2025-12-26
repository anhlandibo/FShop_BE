/* eslint-disable no-prototype-builtins */
import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, DataSource, Like, In, ILike } from 'typeorm';
import { Category } from './entities/category.entity';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  DeleteCategoriesDto,
} from './dto';
import { Department } from '../departments/entities/department.entity';
import { AttributeCategory } from '../attributes/entities/attribute-category.entity';
import { CreateAttributeValueDto } from '../attributes/dto/create-attribute-value.dto';
import { Attribute } from '../attributes/entities/attribute.entity';

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
    file: Express.Multer.File,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // check trùng tên
      if (
        await manager.findOne(Category, {
          where: { name: createCategoryDto.name },
        })
      )
        throw new HttpException('Category already exist', HttpStatus.CONFLICT);
      // check department
      const department = await manager.findOne(Department, {
        where: { id: createCategoryDto.departmentId, isActive: true },
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

      let attributes: CreateAttributeValueDto[] = [];
      if (createCategoryDto.attributes) {
        if (typeof createCategoryDto.attributes === 'string') {
          try {
            attributes = JSON.parse(createCategoryDto.attributes);
          } catch (e) {
            throw new HttpException(
              'Invalid attributes JSON',
              HttpStatus.BAD_REQUEST,
            );
          }
        } else attributes = createCategoryDto.attributes;
      }

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        department,
        imageUrl,
        publicId,
      });
      await manager.save(category);

      // Tạo AttributeCategory records
      if (attributes.length > 0) {
        const attributeEntities = attributes.map((attr) =>
          manager.create('AttributeCategory', {
            attribute: { id: attr.attributeId },
            category,
            value: attr.value,
          }),
        );
        await manager.save('AttributeCategory', attributeEntities);
      }

      return category;
    });
  }

  // logic còn vấn đề
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      console.log(updateCategoryDto.attributes);
      const category = await manager.findOne(Category, {
        where: { id, isActive: true },
        relations: [
          'attributeCategories',
          'attributeCategories.variantAttributeValues',
          'department',
        ],
      });
      if (!category)
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      // Update department
      if (updateCategoryDto.departmentId) {
        const department = await manager.findOne(Department, {
          where: { id: updateCategoryDto.departmentId, isActive: true },
        });
        if (!department)
          throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
        category.department = department;
      }
      Object.assign(category, updateCategoryDto); // merge

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
      await manager.save(category);

      // xóa cũ
      if (category.attributeCategories?.length > 0) {
        for (const attrCat of category.attributeCategories) {
          if (attrCat.variantAttributeValues?.length > 0) {
            attrCat.isActive = false;
            await manager.save(attrCat);
          } else {
            await manager.remove(attrCat);
          }
        }
      }

      // tạo mới
      if (updateCategoryDto.attributes?.length) {
        for (const attr of updateCategoryDto.attributes) {
          const attribute = await manager.findOne(Attribute, {
            where: { id: attr.attributeId, isActive: true },
          });
          if (!attribute)
            throw new HttpException(
              'Attribute not found',
              HttpStatus.NOT_FOUND,
            );
          const newAttrCat = manager.create(AttributeCategory, {
            attribute,
            category,
            value: attr.value,
            isActive: true,
          });
          await manager.save(newAttrCat);
        }
      }

      const updated = await manager.findOne(Category, {
        where: { id: category.id },
        relations: [
          'attributeCategories',
          'attributeCategories.attribute',
          'department',
        ],
      });
      if (updated)
        updated.attributeCategories = updated.attributeCategories.filter(
          (attrCat) => attrCat.isActive,
        );

      return updated;
    });
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, { where: { id, isActive: true } });
      if (!category)
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

      if (category.publicId)
        await this.cloudinaryService
          .deleteFile(category.publicId)
          .catch(() => null);
      // hard delete cho các record attribute-category
      await manager.delete(AttributeCategory, { category: { id } });
      await manager.update(Category, id, { isActive: false });
      return {
        message: 'Category disabled successfully',
        deletedId: id,
      };
    });
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    /* Redis
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
    */
    const [data, total] = await this.categoryRepository.findAndCount({
      where: search
        ? [
            { isActive: true, name: ILike(`%${search}%`) },
          ]
        : { isActive: true },
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
      relations: {
        attributeCategories: {
          attribute: true, 
          category: true, 
        },
      },
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
    // await this.redis.set(redisKey, JSON.stringify(response), 'EX', 60);
    return response;
  }

  async getById(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id, isActive: true },
      relations: [
        'attributeCategories',
        'department',
        'attributeCategories.attribute',
      ],
    });
    if (!category)
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.categoryRepository.findOne({
      where: { slug, isActive: true },
      relations: [
        'attributeCategories',
        'department',
        'attributeCategories.attribute',
      ],
    });
    if (!category)
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    return category;
  }

  async removeMultiple(deleteCategoriesDto: DeleteCategoriesDto) {
    const { ids } = deleteCategoriesDto;
    return await this.dataSource.transaction(async (manager) => {
      const categories = await manager.find(Category, {
        where: { id: In(ids), isActive: true },
      });

      if (!categories || categories.length === 0) {
        throw new HttpException(
          'Not found any categories',
          HttpStatus.NOT_FOUND,
        );
      }
      await manager.delete(AttributeCategory, { category: { id: In(ids) } });
      await manager.update(Category, { id: In(ids) }, { isActive: false });

      return { deletedIds: ids };
    });
  }
}
