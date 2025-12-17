import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Like, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto';

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
        { userId, isDefault: true },
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

  async getMyAddresses(userId: number) {
    const addresses = await this.addressRepository.find({ where: { user: { id: userId } } });
    return addresses;
  }

  async getAddressById(userId: number, addressId: number) {
    const address = await this.addressRepository.findOne({ where: { id: addressId, user: { id: userId } } });
    if (!address) throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    return address;
  }

  async delete(id: number) {
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    await this.addressRepository.remove(address);
    return {
      message: 'Address deleted successfully',
      deletedId: id,
    };
  }

  async update(userId: number, id: number, updateAddressDto: UpdateAddressDto) {
    const address = await this.addressRepository.findOne({ where: {id, user: {id: userId}}, relations: ['user']})
    if (!address) throw new HttpException('Address not found', HttpStatus.NOT_FOUND)

    const { isDefault } = updateAddressDto;
    if (isDefault) {
      await this.addressRepository.update(
        { user: { id: address.user.id }, isDefault: true },
        { isDefault: false },
      )
      address.isDefault = true;
    }
    console.log(updateAddressDto)
    Object.assign(address, updateAddressDto); // merge
    console.log(address)
    await this.addressRepository.save(address)
    return { message: 'Address updated successfully' }
  }

  async setDefault(userId: number, addressId: number) {
  const address = await this.addressRepository.findOne({
    where: { id: addressId, user: { id: userId } },
  });

  if (!address) throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
  
  if (address.isDefault) return { message: 'Address is already set as default' };

  await this.addressRepository.update({ user: { id: userId }, isDefault: true }, { isDefault: false });

  address.isDefault = true;
  await this.addressRepository.save(address);

  return {
    message: 'Set default address successfully',
    data: address,
  };
}
}
