import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { CreateCartDto } from './dto/create-cart.dto';
import { User } from '../users/entities/user.entity';
import { CartItemDto } from './dto/cart-item.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartItem } from './entities/cart-item.entity';
import e from 'express';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(ProductVariant) private productVariantRepository: Repository<ProductVariant>,
  ) {}

  async create(createCartDto: CreateCartDto) {
    const { userId } = createCartDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);
    if (user.cart) throw new HttpException('User already have cart', 400);
    const cart = this.cartRepository.create({ user });
    return await this.cartRepository.save(cart);
  }

  async addToCart(cartId: number,cartItemDto: CartItemDto) {
    const {variantId, quantity} = cartItemDto;
    const cart = await this.cartRepository.findOne({ where: { id: cartId }, relations: ['items', 'items.variant'] });
    if (!cart) throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);

    const variant = await this.productVariantRepository.findOne({ where: { id: variantId } });
    if (!variant) throw new HttpException('Variant not found', HttpStatus.NOT_FOUND);
    if (quantity > variant.remaining) throw new HttpException('Not enough quantity', HttpStatus.BAD_REQUEST);

    const existingCartItem = cart.items.find(item => item.variant.id === variantId);
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      await this.cartItemRepository.save(existingCartItem);
    }
    else {
      const cartItem = this.cartItemRepository.create({
        quantity,
        cart,
        variant,
      })
      await this.cartItemRepository.save(cartItem);
    }
    return this.cartRepository.findOne({ where: { id: cart.id }, relations: ['items', 'items.variant'] });
  }

  async removeFromtCart(cartId: number, cartItemDto: CartItemDto) {
    const {variantId, quantity} = cartItemDto;
    const cart = await this.cartRepository.findOne({ where: { id: cartId }, relations: ['items', 'items.variant'] });

    if (!cart) throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);
    const existingCartItem = cart.items.find(item => item.variant.id === variantId);
    if (!existingCartItem) throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);

    if (existingCartItem.quantity <= quantity) await this.cartItemRepository.remove(existingCartItem);
    else {
      existingCartItem.quantity -= quantity;
      await this.cartItemRepository.save(existingCartItem);
    }
    
    return this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.variant'],
    });
  }

  async getCart(cartId: number){
    const cart = await this.cartRepository.findOne({where: {id: cartId}, relations: ['items', 'items.variant.id']});
    if (!cart) throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);
    return cart;
  }
}
