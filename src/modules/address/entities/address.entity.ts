import { Exclude } from "class-transformer";
import { AddressType } from "src/constants/address-type.enum";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('addresses')
export class Address {
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

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.HOME,
  })
  type: AddressType;

  @Column({ default: false})
  isDefault: boolean;

  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: 'userId' })
  @Exclude()
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}