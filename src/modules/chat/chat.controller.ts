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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 5 },
        { name: 'voice', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB
        },
        fileFilter: (req, file, callback) => {
          const allowedMimes = {
            images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            voice: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/ogg'],
            video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
          };

          const fieldMimes = allowedMimes[file.fieldname];
          if (!fieldMimes || !fieldMimes.includes(file.mimetype)) {
            return callback(
              new BadRequestException(`Invalid file type for ${file.fieldname}`),
              false
            );
          }
          callback(null, true);
        },
      }
    )
  )
  send(
    @Body() dto: SendMessageDto,
    @UploadedFiles() files: {
      images?: Express.Multer.File[];
      voice?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
    @Req() req
  ) {
    return this.service.sendMessage(dto, req.user, files);
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
