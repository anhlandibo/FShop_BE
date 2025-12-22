import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    HttpModule, 
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
