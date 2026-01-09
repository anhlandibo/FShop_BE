/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/chatbot/chatbot.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRequestDto } from './dto/chat-request.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepo: Repository<ChatMessage>,
    private readonly httpService: HttpService,
  ) {}

  async chat(userId: number, dto: ChatRequestDto) {
    const { question } = dto;
    const pythonServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001/chat/ask';

    try {
      const recentMessages = await this.chatRepo.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      const history = recentMessages.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data } = await firstValueFrom(
        this.httpService.post(pythonServiceUrl, {
          question: question,
          history: history,
          user_id: userId,
        }),
      );

      const userMsg = this.chatRepo.create({
        role: 'user',
        content: question,
        user: { id: userId } as User,
      });
      await this.chatRepo.save(userMsg);

      const botMsg = this.chatRepo.create({
        role: 'assistant',
        content: data.answer,
        user: { id: userId } as User,
        metadata: { 
            recommendedProducts: data.products || [] 
        }
      });
      await this.chatRepo.save(botMsg);

      return {
        answer: data.answer,
        products: data.products || [],
      };

    } catch (error) {
      console.error('Chatbot Error:', error.message);
      throw new HttpException('AI Service is currently unavailable.', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }


  // Hàm lấy lịch sử cho Frontend load lần đầu vào trang
  async getHistory(userId: number) {
    return this.chatRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' }, 
      select: ['id', 'role', 'content', 'createdAt', 'metadata'], 
    });
  }
  
  // Hàm xóa lịch sử
  async clearHistory(userId: number) {
      return this.chatRepo.delete({ user: { id: userId } });
  }
}