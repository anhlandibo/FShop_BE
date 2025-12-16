import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Repository, DataSource } from 'typeorm';
import { Product, ProductVariant } from '../products/entities';
import { CreateWishlistsDto } from './dtos/create-wishlits.dto';
import { User } from '../users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistsRepository: Repository<Wishlist>,
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async getMyWishlists(userId: number) {
    console.log(userId);
    const wishlists = await this.wishlistsRepository.find({
      where: { user: { id: userId } },
      relations: ['product.variants'],
    });
    return wishlists;
  }

  async toggle(userId: number, createWishlistDto: CreateWishlistsDto) {
    const { productId } = createWishlistDto;

    return this.dataSource.manager.transaction(async (manager) => {
      // Check product tồn tại
      const product = await manager.findOne(Product, {
        where: { id: productId },
      });
      if (!product)
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

      // Check wishlist item tồn tại chưa
      const existing = await manager.findOne(Wishlist, {
        where: { user: { id: userId }, product: { id: productId } },
        relations: ['user', 'product'],
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
        if (!user)
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const wishlist = manager.create(Wishlist, { user, product });
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
      const wishlists = await manager.find(Wishlist, {
        where: { user: { id: userId } },
      });
      if (!wishlists || wishlists.length === 0)
        throw new HttpException('No wishlists found', HttpStatus.NOT_FOUND);
      await manager.remove(wishlists);
      return {
        message: 'Wishlists removed successfully',
        deletedCount: wishlists.length,
      };
    });
  }
}
