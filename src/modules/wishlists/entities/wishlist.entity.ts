import { Exclude } from "class-transformer";
import { ProductVariant } from "src/modules/products/entities";
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

  @ManyToOne(() => ProductVariant, (variant) => variant.wishlist, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'variantId' })
  @Exclude()
  variant: User

  @CreateDateColumn()
  createdAt: Date;
}