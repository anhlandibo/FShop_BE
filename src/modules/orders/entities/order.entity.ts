import { Exclude } from "class-transformer";
import { OrderStatus } from "src/constants";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from ".";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipientName: string;

  @Column()
  recipientPhone: string;

  @Column()
  detailAddress: string;

  @Column()
  province: string;

  @Column()
  district: string;

  @Column()
  commune: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text' })
  note: string;

  @ManyToOne(() => User, (user) => user.orders)
  @Exclude()
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}