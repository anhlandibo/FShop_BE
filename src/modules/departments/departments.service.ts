import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { DataSource, ILike, Like, Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { Brand } from '../brands/entities/brand.entity';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department) private readonly departmentRepository: Repository<Department>,
    @InjectRedis() private readonly redis: Redis,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(createDepartmentDto: CreateDepartmentDto, file: Express.Multer.File) {
    return await this.dataSource.transaction(async (manager) => {
      const alreadyExist = await manager.findOne(Department, { where: { name: createDepartmentDto.name } });
      if (alreadyExist) throw new HttpException('Department already exist', HttpStatus.CONFLICT);

      let imageUrl: string | undefined;
      let publicId: string | undefined;

      if (file) {
        const uploaded = await this.cloudinaryService.uploadFile(file);
        imageUrl = uploaded?.secure_url;
        publicId = uploaded?.public_id;
      }

      const department = this.departmentRepository.create({
        ...createDepartmentDto,
        imageUrl,
        publicId,
      });
      await manager.save(department);
      return department;
    })
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    /* Redis
    const redisKey = hashKey('departments', query);
    const cachedData: string | null = await this.redis.get(redisKey);
    if (cachedData) {
      console.log('data lay tu redis');
      return JSON.parse(cachedData) as {
        pagination: {
          total: number;
          page: number | undefined;
          limit: number | undefined;
        };
        data: Department[];
      };
    }
    */
    const [data, total] = await this.departmentRepository.findAndCount({
      where: search
        ? [
            { isActive: true, name: ILike(`%${search}%`) },
          ]
        : { isActive: true },
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
      relations: ['categories'],
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

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto, file: Express.Multer.File) {
    return await this.dataSource.transaction(async (manager) => {
      const department = await manager.findOne(Department, { where: { id } });
      if (!department) throw new HttpException('Department not found', HttpStatus.NOT_FOUND);

      Object.assign(department, updateDepartmentDto);

      // Upload ảnh
      if (file) {
        if (department.publicId) await this.cloudinaryService.deleteFile(department.publicId).catch(() => null);
        const uploaded = await this.cloudinaryService.uploadFile(file);
        department.imageUrl = uploaded?.secure_url;
        department.publicId = uploaded?.public_id;
      }

      await manager.save(department);
      return department;
    })
  }

  async delete(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const department = await manager.findOne(Department, { where: { id, isActive: true } });
      if (!department) throw new HttpException('Department not found', HttpStatus.NOT_FOUND);

      if (department.publicId) await this.cloudinaryService.deleteFile(department.publicId).catch(() => null);

      await manager.update(Department, id, { isActive: false });
      return {
        message: 'Department disabled successfully',
        deletedId: id,
      };
    })
  }

  async getById(id: number) {
    const department = await this.departmentRepository.findOne({ where: { id, isActive: true } });
    if (!department) throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
    return department;
  }

  async getBySlug(slug: string) {
    const department = await this.departmentRepository.findOne({ where: { slug, isActive: true } });
    if (!department) throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
    return department;
  }
}
