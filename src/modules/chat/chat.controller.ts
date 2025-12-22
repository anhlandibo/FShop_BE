/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('conversation')
  getOrCreate(@Req() req) {
    return this.service.getOrCreateConversation(req.user);
  }

  @Post('send')
  send(@Body() dto: SendMessageDto, @Req() req) {
    return this.service.sendMessage(dto, req.user);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: number) {
    return this.service.getMessages(Number(id));
  }

  @Post('seen/:id')
  seen(@Param('id') id: number) {
    return this.service.markSeen(id);
  }

  @Get('admin/conversations')
  getAll() {
    return this.service.getAllConversations();
  }
}
