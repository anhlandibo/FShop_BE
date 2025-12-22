import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatGateway } from './chat.gateway';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/constants';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convoRepo: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,

    private readonly gateway: ChatGateway,
  ) {}

  // =========================
  // GET OR CREATE CONVERSATION
  // =========================
  async getOrCreateConversation(user: User) {
    let convo = await this.convoRepo.findOne({
      where: { customer: { id: user.id }, status: 'OPEN' },
      relations: ['customer'],
    });

    if (!convo) {
      convo = this.convoRepo.create({
        customer: user,
        status: 'OPEN',
      });
      await this.convoRepo.save(convo);
    }

    return convo;
  }

  // =========================
  // SEND MESSAGE
  // =========================
  async sendMessage(dto: SendMessageDto, sender: User) {
    const convo = await this.convoRepo.findOne({
      where: { id: dto.conversationId },
      relations: ['customer', 'assignedAdmin'],
    });

    if (!convo) throw new NotFoundException('Conversation not found');

    // User chỉ được chat trong convo của mình
    if (sender.role === Role.User && convo.customer.id !== sender.id) {
      throw new ForbiddenException();
    }

    const message = this.msgRepo.create({
      conversation: convo,
      sender,
      senderRole: sender.role,
      content: dto.content,
      isDelivered: true,
      isSeen: false,
    });

    const saved = await this.msgRepo.save(message);

    // ===== UPDATE CONVERSATION =====
    convo.lastMessageAt = new Date();

    if (sender.role === Role.Admin) {
      convo.status = 'HANDLING';
      convo.assignedAdmin = sender;
    }

    await this.convoRepo.save(convo);

    // ===== BUILD MESSAGE DTO (RẤT QUAN TRỌNG) =====
    const messageDto = {
      id: saved.id,
      conversationId: convo.id,
      content: saved.content,
      senderRole: saved.senderRole,
      sender: {
        id: sender.id,
        fullName: sender.fullName,
        avatar: sender.avatar,
        role: sender.role,
      },
      isSeen: saved.isSeen,
      createdAt: saved.createdAt,
    };

    // ✅ EMIT 1 LẦN – ĐÚNG ROOM
    this.gateway.emitMessage(convo.id, messageDto);

    return messageDto;
  }

  // =========================
  // MARK SEEN
  // =========================
  async markSeen(conversationId: number) {
    await this.msgRepo.update(
      {
        conversation: { id: conversationId },
        isSeen: false,
      },
      { isSeen: true },
    );

    this.gateway.emitSeen(conversationId);
  }

  // =========================
  // GET MESSAGES
  // =========================
  async getMessages(conversationId: number) {
    const messages = await this.msgRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    // ✅ MAP DTO – FE KHÔNG PHẢI ĐOÁN
    return messages.map((m) => ({
      id: m.id,
      conversationId,
      content: m.content,
      senderRole: m.senderRole,
      sender: {
        id: m.sender.id,
        fullName: m.sender.fullName,
        avatar: m.sender.avatar,
        role: m.sender.role,
      },
      isSeen: m.isSeen,
      createdAt: m.createdAt,
    }));
  }

  // =========================
  // ADMIN GET ALL CONVERSATIONS
  // =========================
  async getAllConversations() {
    return this.convoRepo.find({
      relations: ['customer', 'assignedAdmin'],
      order: { lastMessageAt: 'DESC' },
    });
  }
}
