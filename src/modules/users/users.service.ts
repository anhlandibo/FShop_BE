/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hashKey, hashPassword } from 'src/utils/hash';
import { User } from 'src/modules/users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CartsService } from '../carts/carts.service';
import { CreateUserDto, UpdateUserDto, DeleteUsersDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly cartService: CartsService
  ) {}
  async create(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    if (await this.usersRepository.findOne({where: { email: createUserDto.email }}))
      throw new HttpException('Email exists', HttpStatus.CONFLICT);
    const password = await hashPassword(createUserDto.password);

    let imageUrl: string | undefined;
    let publicId: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file);
      imageUrl = uploaded?.secure_url;
      publicId = uploaded?.public_id;
    }
    const user = this.usersRepository.create({
      ...createUserDto,
      avatar: imageUrl,
      publicId,
      password,
    });
    await this.usersRepository.save(user);
    await this.cartService.create({ userId: user.id });
    return user;
  }

  async createMany(createUsersDto: CreateUserDto[]) {
    return this.dataSource.manager.transaction(async (manager) => {
      const users: User[] = [];
      for (const dto of createUsersDto) {
        const existingUser = await manager.findOne(User, {where: {email: dto.email}});
        if (existingUser) throw new HttpException('Email exists', HttpStatus.CONFLICT);
          
        const password = await hashPassword(dto.password);
        users.push(await manager.save(User, { ...dto, password }));
      }
      return users;
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    const existingEmail = await this.usersRepository.findOne({where: { email: updateUserDto.email }});
    if (existingEmail && existingEmail.id !== id) 
      throw new HttpException('Email exists', HttpStatus.CONFLICT);
    const existingUser = await this.usersRepository.findOne({where: { id }});
    if (!existingUser) throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    Object.assign(existingUser, updateUserDto); // merge
    if (file) {
      if (existingUser.publicId) {
        await this.cloudinaryService
          .deleteFile(existingUser.publicId)
          .catch(() => null);
      }
      const uploaded = await this.cloudinaryService.uploadFile(file);
      existingUser.avatar = uploaded?.secure_url;
      existingUser.publicId = uploaded?.public_id;
    }
    return this.usersRepository.update(id, existingUser);
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['cart'],
    });
    if (!user) throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    return user;
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const redisKey = hashKey('users', query);
    const cachedData: string | null = await this.redis.get(redisKey);
    if (cachedData) {
      console.log('data lay tu redis');
      return JSON.parse(cachedData) as {
        pagination: {
          total: number;
          page: number | undefined;
          limit: number | undefined;
        };
        data: User[];
      };
    }
    const [data, total] = await this.usersRepository.findAndCount({
      where: search
        ? [{ fullName: Like(`%${search}%`) }, { email: Like(`%${search}%`) }]
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

  async remove(id: number) {
    const user = await this.usersRepository.findOne({where: { id }});
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    await this.usersRepository.remove(user);
    return {
      message: 'User soft deleted successfully',
      deletedId: id,
    };
  }

  async removeUsers(deleteUsersDto: DeleteUsersDto) {
    const { ids } = deleteUsersDto;

    return await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, {where: { id: In(ids) }});

      if (!users || users.length === 0) 
        throw new HttpException('Not found any users', HttpStatus.NOT_FOUND);
      
      await manager.remove(users);

      return { deletedIds: ids };
    });
  }
}
