import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Like, Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { User } from '../users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(userId: number, createAddressDto: CreateAddressDto) {
    const { isDefault } = createAddressDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (isDefault)
      await this.addressRepository.update(
        { user: { id: userId }, isDefault: true },
        { isDefault: false },
      );

    const newAddress = this.addressRepository.create({
      ...createAddressDto,
      user: user,
      isDefault: isDefault || false,
    });
    return await this.addressRepository.save(newAddress);
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const [data, total] = await this.addressRepository.findAndCount({
      where: search
        ? [{ detailAddress: Like(`%${search}%`) }, { province: Like(`%${search}%`) }, { district: Like(`%${search}%`) }, { commune: Like(`%${search}%`) }]
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
    return response;
  }
}
