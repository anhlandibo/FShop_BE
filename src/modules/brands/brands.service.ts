import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { DataSource, In, Like, Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateBrandDto, UpdateBrandDto, DeleteBrandsDto } from './dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createBrandDto: CreateBrandDto, file: Express.Multer.File) {
    return await this.dataSource.transaction(async (manager) => {
      const alreadyExist = await manager.findOne(Brand, { where: { name: createBrandDto.name } });
      if (alreadyExist) throw new HttpException('Brand already exist', HttpStatus.CONFLICT);
  
      let imageUrl: string | undefined;
      let publicId: string | undefined;
  
      if (file) {
        const uploaded = await this.cloudinaryService.uploadFile(file);
        imageUrl = uploaded?.secure_url;
        publicId = uploaded?.public_id;
      }
  
      const brand = this.brandRepository.create({
        ...createBrandDto,
        imageUrl,
        publicId,
      });
      await manager.save(brand);
      return brand;
    })
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

  async update(id: number, updateBrandDto: UpdateBrandDto, file: Express.Multer.File) {
    return await this.dataSource.transaction(async (manager) => {
      const brand = await manager.findOne(Brand, { where: { id } });
      if (!brand) throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
      Object.assign(brand, updateBrandDto); // merge 
      if (file) {
        if (brand.publicId) await this.cloudinaryService.deleteFile(brand.publicId).catch(() => null)
        const uploaded = await this.cloudinaryService.uploadFile(file);
        brand.imageUrl = uploaded?.secure_url;
        brand.publicId = uploaded?.public_id;
      }
      return await manager.save(brand);
    })
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const brand = await manager.findOne(Brand, { where: { id } });
      if (!brand) throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
  
      if (brand.publicId) await this.cloudinaryService.deleteFile(brand.publicId).catch(() => null);
      
      await manager.update(Brand, { id }, { isActive: false });
      return {
        message: 'Brand disabled successfully',
        deletedId: id,
      };
    })
  }

  async deleteMany(deleteBrandsDto: DeleteBrandsDto) {
    const { ids } = deleteBrandsDto;

    return await this.dataSource.transaction(async (manager) => {
      const brands = await manager.find(Brand, {where: { id: In(ids) }});

      if (!brands || brands.length === 0) 
        throw new HttpException('Not found any brands', HttpStatus.NOT_FOUND);
      
      for (const brand of brands) 
        if (brand.publicId) await this.cloudinaryService.deleteFile(brand.publicId).catch(() => null);

      await manager.remove(brands);

      return { deletedIds: ids };
    })
  }

  async getById(id: number) {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
    return brand;
  }

  async getBySlug(slug: string) {
    const brand = await this.brandRepository.findOne({ where: { slug } });
    if (!brand) throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
    return brand;
  }
}
