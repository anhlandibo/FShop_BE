/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/chatbot/chatbot.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRequestDto } from './dto/chat-request.dto';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepo: Repository<ChatMessage>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private readonly httpService: HttpService,
    private readonly cloudinaryService: CloudinaryService,
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

    } catch (error: any) {
      console.error('Chatbot Error:', error?.message || error);
      throw new HttpException('AI Service is currently unavailable.', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }


  // Hàm lấy lịch sử cho Frontend load lần đầu vào trang
  async getHistory(userId: number) {
    const messages = await this.chatRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' }, 
      select: ['id', 'role', 'content', 'createdAt', 'metadata'], 
    });

    console.log('\n=== GET HISTORY DEBUG ===');
    console.log('Total messages:', messages.length);
    const messagesWithProducts = messages.filter(m => m.metadata?.products);
    console.log('Messages with products:', messagesWithProducts.length);
    if (messagesWithProducts.length > 0) {
      console.log('Sample message with products:', {
        id: messagesWithProducts[0].id,
        role: messagesWithProducts[0].role,
        productsCount: messagesWithProducts[0].metadata?.products?.length,
        firstProduct: messagesWithProducts[0].metadata?.products?.[0],
      });
    }
    console.log('========================\n');

    return messages;
  }
  
  // Hàm xóa lịch sử
  async clearHistory(userId: number) {
      return this.chatRepo.delete({ user: { id: userId } });
  }

  /**
   * Helper method: Enrich AI results with full product details from database
   */
  private async enrichProductsWithDetails(aiResults: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const productIds = aiResults.map(item => item.product_id);
    
    // Fetch products from database with relations
    const products = await this.productRepo.find({
      where: { id: In(productIds) },
      relations: ['category', 'brand', 'images'],
    });

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Merge AI results with database details
    return aiResults.map((aiItem: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const product = productMap.get(aiItem.product_id);
      if (!product) {
        return {
          product_id: aiItem.product_id,
          score: aiItem.score,
          name: `Product ${aiItem.product_id}`,
          price: 0,
          image_url: aiItem.image_url || '',
          category: 'Unknown',
        };
      }

      return {
        product_id: product.id,
        score: aiItem.score,
        name: product.name,
        price: product.price,
        image_url: product.images?.[0]?.imageUrl || aiItem.image_url || '',
        category: product.category?.name || 'Unknown',
        brand: product.brand?.name || null,
      };
    });
  }

  /**
   * Chat bằng Image - Tìm kiếm sản phẩm tương tự và tạo response tự nhiên
   */
  async chatWithImage(userId: number, file: Express.Multer.File, message?: string) {
    try {
      // 1. Upload ảnh lên Cloudinary để lưu URL
      const uploadResult = await this.cloudinaryService.uploadFileToFolder(
        file,
        'chatbot/images',
        'image'
      );
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error('Failed to upload image to Cloudinary');
      }
      const imageUrl = uploadResult.secure_url;

      // 2. Gọi AI Service để search bằng image
      const searchFormData = new FormData();
      const imageBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
      searchFormData.append('file', imageBlob, file.originalname);

      const { data: aiResults } = await firstValueFrom(
        this.httpService.post('http://localhost:8001/search/image', searchFormData),
      );

      // Debug: Log AI response
      console.log('\n=== IMAGE SEARCH AI RESPONSE ===');
      console.log('Total products found:', aiResults?.length || 0);
      if (aiResults && aiResults.length > 0) {
        console.log('First product sample:', JSON.stringify(aiResults[0], null, 2));
      }
      console.log('================================\n');

      // 3. Lưu user message vào DB với URL ảnh
      const userContent = message || 'Sent an image to search for similar products';
      const userMsg = this.chatRepo.create({
        role: 'user',
        content: userContent,
        user: { id: userId } as User,
        metadata: {
          type: 'image',
          hasImage: true,
          imageUrl: imageUrl,
          cloudinaryPublicId: uploadResult.public_id,
        },
      });
      await this.chatRepo.save(userMsg);

      // 4. Xử lý kết quả AI
      if (!aiResults || aiResults.length === 0) {
        const noResultMsg = this.chatRepo.create({
          role: 'assistant',
          content: "I couldn't find any products similar to your image. Please try another image or describe what you're looking for!",
          user: { id: userId } as User,
          metadata: { 
            type: 'image_response', 
            productsFound: 0,
          },
        });
        await this.chatRepo.save(noResultMsg);

        return {
          answer: noResultMsg.content,
          products: [],
          imageUrl: imageUrl,
        };
      }

      // 5. Enrich AI results with full product details from database
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const productsWithDetails = await this.enrichProductsWithDetails(aiResults);

      // 6. Format danh sách sản phẩm
      const productsList = productsWithDetails.slice(0, 5).map((item: any, index: number) => 
        `${index + 1}. ${item.name} - $${item.price} (Similarity: ${(item.score * 100).toFixed(1)}%)`
      ).join('\n');

      const botAnswer = `I found ${productsWithDetails.length} products similar to your image! Here are the top matches:\n\n${productsList}\n\nWould you like more details about any of these?`;

      // 7. Lưu bot response
      const botMsg = this.chatRepo.create({
        role: 'assistant',
        content: botAnswer,
        user: { id: userId } as User,
        metadata: {
          type: 'image_response',
          hasImage: true,
          imageUrl: imageUrl,
          productsFound: productsWithDetails.length,
          products: productsWithDetails,
        },
      });
      await this.chatRepo.save(botMsg);

      console.log('\n=== BOT MESSAGE SAVED (IMAGE) ===');
      console.log('Message ID:', botMsg.id);
      console.log('Products in metadata:', botMsg.metadata?.products?.length || 0);
      console.log('Sample product:', botMsg.metadata?.products?.[0]);
      console.log('==================================\n');

      return {
        answer: botAnswer,
        products: productsWithDetails,
        imageUrl: imageUrl,
      };

    } catch (error: any) {
      console.error('Image Chat Error:', error?.message || error);
      throw new HttpException(
        'Image search service is currently unavailable.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Chat bằng Voice - Transcribe voice thành text và search
   */
  async chatWithVoice(userId: number, file: Express.Multer.File) {
    try {
      // 1. Upload audio lên Cloudinary để lưu URL
      const uploadResult = await this.cloudinaryService.uploadFileToFolder(
        file,
        'chatbot/audio',
        'auto' // Cloudinary tự detect audio
      );
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error('Failed to upload audio to Cloudinary');
      }
      const audioUrl = uploadResult.secure_url;

      // 2. Gọi AI Service để xử lý voice
      const voiceFormData = new FormData();
      const audioBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
      voiceFormData.append('file', audioBlob, file.originalname);

      const { data: aiResults } = await firstValueFrom(
        this.httpService.post('http://localhost:8001/search/voice', voiceFormData),
      );

      // Debug: Log AI response
      console.log('\n=== VOICE SEARCH AI RESPONSE ===');
      console.log('Transcribed text:', aiResults?.transcribed_text);
      console.log('Total products found:', aiResults?.products?.length || 0);
      if (aiResults?.products && aiResults.products.length > 0) {
        console.log('First product sample:', JSON.stringify(aiResults.products[0], null, 2));
      }
      console.log('================================\n');

      const transcribedText = aiResults.transcribed_text || 'Audio could not be transcribed';
      const products = aiResults.products || [];

      // 3. Lưu user message (voice transcript) với URL audio
      const userMsg = this.chatRepo.create({
        role: 'user',
        content: transcribedText,
        user: { id: userId } as User,
        metadata: {
          type: 'voice',
          hasAudio: true,
          audioUrl: audioUrl,
          cloudinaryPublicId: uploadResult.public_id,
        },
      });
      await this.chatRepo.save(userMsg);

      // 4. Xử lý kết quả
      if (products.length === 0) {
        const noResultMsg = this.chatRepo.create({
          role: 'assistant',
          content: `I heard you say: "${transcribedText}"\n\nUnfortunately, I couldn't find matching products. Could you try rephrasing or provide more details?`,
          user: { id: userId } as User,
          metadata: { type: 'voice_response', productsFound: 0 },
        });
        await this.chatRepo.save(noResultMsg);

        return {
          transcribed: transcribedText,
          answer: noResultMsg.content,
          products: [],
          audioUrl: audioUrl,
        };
      }

      // 5. Enrich products with full details from database
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const productsWithDetails = await this.enrichProductsWithDetails(products);

      // 6. Tạo response
      const productsList = productsWithDetails.slice(0, 5).map((item: any, index: number) => 
        `${index + 1}. ${item.name} - $${item.price}`
      ).join('\n');

      const botAnswer = `I heard: "${transcribedText}"\n\nI found ${productsWithDetails.length} matching products:\n\n${productsList}\n\nLet me know if you need more information!`;

      const botMsg = this.chatRepo.create({
        role: 'assistant',
        content: botAnswer,
        user: { id: userId } as User,
        metadata: {
          type: 'voice_response',
          productsFound: productsWithDetails.length,
          products: productsWithDetails,
        },
      });
      await this.chatRepo.save(botMsg);

      console.log('\n=== BOT MESSAGE SAVED (VOICE) ===');
      console.log('Message ID:', botMsg.id);
      console.log('Products in metadata:', botMsg.metadata?.products?.length || 0);
      console.log('Sample product:', botMsg.metadata?.products?.[0]);
      console.log('==================================\n');

      return {
        transcribed: transcribedText,
        answer: botAnswer,
        products: productsWithDetails,
        audioUrl: audioUrl,
      };

    } catch (error: any) {
      console.error('Voice Chat Error:', error?.message || error);
      throw new HttpException(
        'Voice search service is currently unavailable.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}