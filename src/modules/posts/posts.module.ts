import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, PostImage, PostProduct, PostLike, PostComment, PostBookmark, PostShare } from './entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Product } from '../products/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostImage, PostProduct, PostLike, PostComment, PostBookmark, PostShare, Product]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
