import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { ReviewImage } from './entities/review-image.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Product } from '../products/entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewVote, ReviewImage, Product]), CloudinaryModule, NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
