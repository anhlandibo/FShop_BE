import { Exclude } from "class-transformer";
import { Product, ProductVariant } from "src/modules/products/entities";
import { User } from "src/modules/users/entities/user.entity";
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('wishlists')
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;


  @ManyToOne(() => User, (user) => user.wishlist, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'userId' })
  @Exclude()
  user: User

  @ManyToOne(() => Product, (product) => product.wishlist, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'productId' })
  @Exclude()
  product: Product

  @CreateDateColumn()
  createdAt: Date;
}