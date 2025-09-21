import { Role } from 'src/constants/role.enum';
import { Address } from 'src/modules/address/entities/address.entity';
import { Cart } from 'src/modules/carts/entities';
import { Order } from 'src/modules/orders/entities';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  publicId: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({type: 'enum', enum: Role, default: Role.User})
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Cart, (cart) => cart.user, {cascade: true})
  cart: Cart;

  @OneToMany(() => Address, address => address.user)
  addresses: Address[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}
