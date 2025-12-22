/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiOperation } from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';
import { Auth } from '../auth/entities/auth.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Chat with AI Assistant (Stateful - Saves DB)' })
  async ask(@Req() req: any, @Body() dto: ChatRequestDto) {
    const {id} = req['user'];
    return this.chatbotService.chat(id, dto);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get full chat history for current user' })
  async getHistory(@Req() req: any) {
    const {id} = req['user']
    return this.chatbotService.getHistory(id);
  }
  
  @Delete('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Clear chat history' })
  async clearHistory(@Req() req: any) {
      const {id} = req['user']
      return this.chatbotService.clearHistory(id);
  }
}
