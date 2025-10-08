import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Repository, DataSource } from 'typeorm';
import { ProductVariant } from '../products/entities';
import { CreateWishlistsDto } from './dtos/create-wishlits.dto';
import { User } from '../users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist) private wishlistsRepository: Repository<Wishlist>,
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(userId: number, createWishlistDto: CreateWishlistsDto) {
    return this.dataSource.manager.transaction(async (manager) => {
      const variant = await manager.findOne(ProductVariant, {where: {id: createWishlistDto.productId}});
      if (!variant) throw new HttpException('Variant not found', HttpStatus.NOT_FOUND);

      const user = await manager.findOne(User, {where: {id: userId}});
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      
      const wishlist = await manager.findOne(Wishlist, {
        where: {
          user: {id: userId},
          product: {id: createWishlistDto.productId}
        }
      })
      if (wishlist) throw new HttpException('Wishlist already exists', HttpStatus.CONFLICT);

      return await manager.save(Wishlist, {
        user,
        variant
      });
    })
  }

  async getMyWishlists(userId: number) {
    const wishlists = await this.wishlistsRepository.find({ 
      where: { user: { id: userId } },
      relations: ['variant', 'variant.product']
    });
    return wishlists;
  }

  async remove(userId:number, wishlistId: number) {
    const wishlist = await this.wishlistsRepository.findOne({ where: { id: wishlistId, user: {id: userId} } });
    if (!wishlist) throw new HttpException('Wishlist not found', HttpStatus.NOT_FOUND);
    await this.wishlistsRepository.remove(wishlist);
    return {
      message: 'Wishlist deleted successfully',
      deletedId: wishlistId,
    };
  }

  async toggle(userId: number, createWishlistDto: CreateWishlistsDto) {
  const { productId } = createWishlistDto;

  return this.dataSource.manager.transaction(async (manager) => {
    // Check variant tồn tại
    const variant = await manager.findOne(ProductVariant, {where: { id: productId }});
    if (!variant) throw new HttpException('Variant not found', HttpStatus.NOT_FOUND);
    
    // Check wishlist item tồn tại chưa
    const existing = await manager.findOne(Wishlist, {
      where: {user: { id: userId }, product: { id: productId }},
      relations: ['user', 'variant'],
    });

    if (existing) {
      // Nếu đã có thì xóa
      await manager.remove(existing);
      return {
        message: 'Wishlist item removed',
        action: 'removed',
        productId,
      };
    } else {
      // Nếu chưa có thì thêm
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const wishlist = manager.create(Wishlist, { user, variant });
      const saved = await manager.save(wishlist);

      return {
        message: 'Wishlist item added',
        action: 'added',
        wishlist: saved,
      };
    }
  });
  }

  async removeAll(userId: number) {
    return this.dataSource.manager.transaction(async (manager) => {
      const wishlists = await manager.find(Wishlist, { where: { user: { id: userId } } });
      if (!wishlists || wishlists.length === 0) throw new HttpException('No wishlists found', HttpStatus.NOT_FOUND);
      await manager.remove(wishlists);
      return { message: 'Wishlists removed successfully', deletedCount: wishlists.length };
    });
  }

}
