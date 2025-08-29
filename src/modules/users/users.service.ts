import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword } from 'src/utils/hash';
import { User } from 'src/modules/users/entities/user.entity';
import { RemoveUserDto } from 'src/modules/users/dto/remove-user.dto';
import { QueryDto } from 'src/dto/query.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) { }
  async create(createUserDto: CreateUserDto) {
    if (await this.usersRepository.findOne({ where: { email: createUserDto.email } }))
      throw new HttpException("Email exists", HttpStatus.CONFLICT)
    const password = await hashPassword(createUserDto.password)
    return this.usersRepository.save({
      ...createUserDto,
      password
    })
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email }
    })
    if (!user)
      throw new HttpException("Not found user", HttpStatus.NOT_FOUND)
    return user
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const [data, total] = await this.usersRepository.findAndCount({
      where: search
        ? [
          { fullName: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
        ]
        : {},
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
    });
    return {
      pagination: {
        total,
        page,
        limit
      },
      data
    };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(removeUserDto: RemoveUserDto) {
    const id = removeUserDto.id
    if (!(await this.usersRepository.findOne({ where: { id: id } })))
      throw new HttpException("Not found user", HttpStatus.NOT_FOUND)
    await this.usersRepository.delete(id)
    return id
  }
}
