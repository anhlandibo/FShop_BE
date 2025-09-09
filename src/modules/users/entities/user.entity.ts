import { Role } from 'src/constants/role.enum';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    avatar: string

    @Column({ nullable: true })
    publicId: string


    @Column()
    fullName: string

    @Column({ unique: true })
    email: string

    @Column()
    password: string

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.User, // mặc định là user
    })
    role: Role

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
