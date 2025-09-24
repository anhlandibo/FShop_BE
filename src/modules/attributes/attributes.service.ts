import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeCategory } from './entities/attribute-category.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute) private attributeRepository: Repository<Attribute>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createAttributeDto: CreateAttributeDto) {
    return await this.dataSource.transaction(async (manager) => {
      const existingAttribute = await manager.findOne(Attribute, {where: { name: createAttributeDto.name }});
      if (existingAttribute) throw new HttpException('Attribute name already exist', HttpStatus.CONFLICT);
      const attribute = manager.create(Attribute, {
        ...createAttributeDto,
      });
      await manager.save(attribute);
      return attribute;
    })
  }

  async getAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const [data, total] = await this.attributeRepository.findAndCount({
      where: search
        ? [{ name: Like(`%${search}%`) }]
        : {},
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
      relations: ['attributeCategories'],
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

  async update(id: number, updateAttributeDto: UpdateAttributeDto) {
    return await this.dataSource.transaction(async (manager) => {
      const attribute = await manager.findOne(Attribute, { where: { id } });
      if (!attribute) throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND);
      Object.assign(attribute, updateAttributeDto); // merge 
      return await manager.save(attribute);
    })
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const attribute = await manager.findOne(Attribute, { where: { id } });
      if (!attribute) throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND);

      await manager.update(Attribute, { id }, { isActive: false });
      return {
        message: 'Attribute disabled successfully',
        deletedId: id,
      };
    });
  }

  async getAttributeCategory(categoryId: number, attributeId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const attribute = await manager.findOne(Attribute, { where: { id: attributeId } });
      if (!attribute) throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND);

      const category = await manager.findOne(Category, { where: { id: categoryId } });
      if (!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

      const attributeCategory = await manager.findOne(AttributeCategory, {
        where: {
          category: { id: categoryId },
          attribute: { id: attributeId },
        }
      });
      if (!attributeCategory) throw new HttpException('Attribute category not found', HttpStatus.NOT_FOUND);
      return attributeCategory;
    });
  }

  async getAttributeCategories(categoryId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, { where: { id: categoryId } });
      if (!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

      const attributeCategories = await manager.find(AttributeCategory, {
        where: {
          category: { id: categoryId },
        }
      });
      return attributeCategories;
    });
  }
}
