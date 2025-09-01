import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword } from 'src/utils/hash';
import { User } from 'src/modules/users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';
import { DeleteUsersDto } from 'src/modules/users/dto/delete-users.dto';

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

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingEmail = await this.usersRepository.findOne({ where: { email: updateUserDto.email } })
    if (existingEmail && existingEmail.id !== id)
      throw new HttpException("Email exists", HttpStatus.CONFLICT)
    console.log(updateUserDto)
    return this.usersRepository.update(id, updateUserDto)
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

  async remove(id: number) {
    if (!(await this.usersRepository.findOne({ where: { id: id } })))
      throw new HttpException("Not found user", HttpStatus.NOT_FOUND)
    await this.usersRepository.delete(id)
    return id
  }

  async removeUsers(deleteUsersDto: DeleteUsersDto) {
    const { ids } = deleteUsersDto;

    const users = await this.usersRepository.find({
      where: { id: In(ids) }
    });

    if (!users || users.length === 0) {
      throw new HttpException("Not found any users", HttpStatus.NOT_FOUND);
    }

    await this.usersRepository.delete(ids);

    return { deletedIds: ids };
  }

}
