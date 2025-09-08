/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hashKey, hashPassword } from 'src/utils/hash';
import { User } from 'src/modules/users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';
import { DeleteUsersDto } from 'src/modules/users/dto/delete-users.dto';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
  ) {}
  async create(createUserDto: CreateUserDto) {
    if (
      await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      })
    )
      throw new HttpException('Email exists', HttpStatus.CONFLICT);
    const password = await hashPassword(createUserDto.password);

    return this.usersRepository.save({
      ...createUserDto,
      password,
    });
  }

  async createMany(createUsersDto: CreateUserDto[]) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const users: User[] = [];
      for (const dto of createUsersDto) {
        const existingUser = await queryRunner.manager.findOne(User, {
          where: {
            email: dto.email,
          },
        });
        if (existingUser) {
          throw new HttpException('Email exists', HttpStatus.CONFLICT);
        }
        const password = await hashPassword(dto.password);
        users.push(await queryRunner.manager.save(User, { ...dto, password }));
      }

      await queryRunner.commitTransaction();
      return users;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingEmail = await this.usersRepository.findOne({
      where: { email: updateUserDto.email },
    });
    if (existingEmail && existingEmail.id !== id)
      throw new HttpException('Email exists', HttpStatus.CONFLICT);
    return this.usersRepository.update(id, updateUserDto);
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
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
    if (!(await this.usersRepository.findOne({ where: { id: id } })))
      throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    await this.usersRepository.delete(id);
    return id;
  }

  async removeUsers(deleteUsersDto: DeleteUsersDto) {
    const { ids } = deleteUsersDto;

    return await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, {
        where: { id: In(ids) },
      });

      if (!users || users.length === 0) {
        throw new HttpException('Not found any users', HttpStatus.NOT_FOUND);
      }

      await manager.delete(User, ids);

      return { deletedIds: ids };
    });
  }
}
