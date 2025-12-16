import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity'; // nếu có user entity

@Entity('notifications')
@Index(['user', 'isRead', 'createdAt'])
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @ManyToOne(() => User, { nullable: true })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
