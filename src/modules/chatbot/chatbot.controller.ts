import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Post, 
  Req, 
  UploadedFile, 
  UseGuards, 
  UseInterceptors,
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatbotService } from './chatbot.service';
import { ApiConsumes, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatImageDto } from './dto/chat-image.dto';
import { ChatVoiceDto } from './dto/chat-voice.dto';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
  };
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Chat with AI Assistant (Stateful - Saves DB)' })
  async ask(@Req() req: AuthenticatedRequest, @Body() dto: ChatRequestDto) {
    const userId = req.user.id;
    return this.chatbotService.chat(userId, dto);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get full chat history for current user' })
  async getHistory(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.chatbotService.getHistory(userId);
  }
  
  @Delete('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Clear chat history' })
  async clearHistory(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.chatbotService.clearHistory(userId);
  }

  @Post('ask/image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Chat with AI using an image (Image Search + Context)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to search for similar products'
        },
        message: {
          type: 'string',
          description: 'Optional text message with the image',
          example: 'Do you have this in blue?'
        }
      },
      required: ['image']
    }
  })
  async askWithImage(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ChatImageDto
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const userId = req.user.id;
    return this.chatbotService.chatWithImage(userId, file, dto.message);
  }

  @Post('ask/voice')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Chat with AI using voice (Voice-to-Text + Product Search)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (supports: mp3, wav, m4a, webm, ogg)'
        }
      },
      required: ['audio']
    }
  })
  async askWithVoice(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }
    const userId = req.user.id;
    return this.chatbotService.chatWithVoice(userId, file);
  }
}
