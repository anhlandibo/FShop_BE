import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/modules/users/entities/user.entity";
import { Exclude } from "class-transformer";

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    role: string;

    @Column({ type: 'text' })
    content: string;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @Exclude()
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}