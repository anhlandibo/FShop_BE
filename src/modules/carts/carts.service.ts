import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { CreateCartDto } from './dto/create-cart.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private cartRepository: Repository<Cart>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createCartDto: CreateCartDto) {
    const { userId } = createCartDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);
    if (user.cart) throw new HttpException('User already have cart', 400);
    const cart = this.cartRepository.create({ user });
    return await this.cartRepository.save(cart);
  }

  async remove(id: number) {
    const cart = await this.cartRepository.findOne({ where: { id } });
    if (!cart) throw new HttpException('Cart not found', 404);
    await this.cartRepository.remove(cart);
    return {
      message: 'Cart deleted successfully',
      deletedId: id,
    };
  }
}
