import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Order, OrderItem } from './entities';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Cart, CartItem } from '../carts/entities';
import { OrderStatus } from 'src/constants';
import { ProductVariant } from '../products/entities';
import { Address } from '../address/entities/address.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepository: Repository<OrderItem>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    return await this.dataSource.manager.transaction(async (manager) => {
      const { addressId, note, items } = createOrderDto;
      const address = await manager.findOne(Address, { where: { user: { id: userId }, id: addressId }});
      if (!address) throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
      console.log(address)
      const cart = await manager.findOne(Cart, { where: { user: { id: userId }}, relations: ['items', 'items.variant', 'user']});

      if (!cart || cart.items.length == 0) throw new HttpException('Cart is empty', HttpStatus.NOT_FOUND);

      const order = manager.create(Order, {
        user: cart.user,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        detailAddress: address.detailAddress,
        province: address.province,
        district: address.district,
        commune: address.commune,
        status: OrderStatus.PENDING,
        note: note,
        totalAmount: 0
      })
      await manager.save(order);

      let totalAmount = 0;
      for (const item of items) {
        const cartItem = cart.items.find(cartItem => cartItem.variant.id === item.variantId );
        if (!cartItem) throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);
        //Check tồn kho
        if (item.quantity > cartItem.variant.remaining) 
          throw new HttpException('Not enough quantity', HttpStatus.BAD_REQUEST);

        // Trừ tồn kho
        cartItem.variant.remaining -= item.quantity;
        await manager.save(ProductVariant, cartItem.variant);

        // Tạo order item
        const orderItem = manager.create(OrderItem, {
          order,
          variant: cartItem.variant,
          quantity: item.quantity,
          price: cartItem.variant.price
        })
        await manager.save(orderItem);
        totalAmount += item.quantity * orderItem.price;

        // Cập nhật cart
        if (item.quantity >= cartItem.quantity) await manager.remove(cartItem);
        else {
          cartItem.quantity -= item.quantity;
          await manager.save(CartItem, cartItem);
        }
      }

      order.totalAmount = totalAmount;
      await manager.save(order);
      return order;
    })
  }
}
