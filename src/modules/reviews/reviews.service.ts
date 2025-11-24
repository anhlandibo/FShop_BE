/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Review } from './entities/review.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewImage } from './entities/review-image.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities';
import { OrderStatus, ReviewStatus } from 'src/constants';
import { QueryDto } from 'src/dto/query.dto';
import { hashKey } from 'src/utils/hash';
import { VoteReviewDto } from './dto/vote-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Order } from '../orders/entities';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewsRepository: Repository<Review>,
    @InjectRepository(ReviewImage)
    private reviewImagesRepository: Repository<ReviewImage>,
    @InjectRepository(ReviewVote)
    private reviewVotesRepository: Repository<ReviewVote>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationsService,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: number,
    images: Array<Express.Multer.File>,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const product = await manager.findOne(Product, {
        where: { id: createReviewDto.productId },
      });
      if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

      const order = await manager.findOne(Order, {
        where: {
          id: createReviewDto.orderId,
          user: { id: userId },
        },
        relations: ['items', 'items.product'],
      });
      if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND);

      if (order.status !== OrderStatus.DELIVERED)
        throw new HttpException('You can only review products after the order has been delivered', HttpStatus.BAD_REQUEST);

      const hasProduct = order.items?.some(
        (item) => item.variant && item.variant.product.id === createReviewDto.productId,
      );

      if (!hasProduct) 
        throw new HttpException('This product is not part of the specified order', HttpStatus.BAD_REQUEST);

      const existingReview = await manager.findOne(Review, {
        where: {
          user: { id: userId },
          product: { id: createReviewDto.productId },
          order: { id: createReviewDto.orderId },
        }
      })
      if (existingReview) 
        throw new HttpException('You already reviewed this product in this order', HttpStatus.BAD_REQUEST);
      

      const review = manager.create(Review, {
        user,
        product,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        status: ReviewStatus.PENDING,
      });
      const savedReview = await manager.save(review);

      // upload images
      if (images.length > 0) {
        const uploads = await Promise.all(
          images.map((image) => this.cloudinaryService.uploadFile(image)),
        );
        const imgs = uploads.map((u) =>
          manager.create(ReviewImage, {
            review: savedReview,
            imageUrl: u?.secure_url,
            publicId: u?.public_id,
          }),
        );
        await manager.save(imgs);
        savedReview.images = imgs;
      }

      await this.updateProductRating(manager, product.id);

      return savedReview;
    });
  }

  private async updateProductRating(manager: any, productId: number) {
    const { avg, count } = await manager
      .createQueryBuilder(Review, 'r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.product = :productId', { productId })
      .andWhere('r.status = :status', { status: ReviewStatus.APPROVED }) // chỉ cập nhật khi review đã được duyệt
      .getRawOne();

    await manager.update(Product, productId, {
      averageRating: avg ?? 0,
      reviewCount: count ?? 0,
    });
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    const [data, total] = await this.reviewsRepository.findAndCount({
      where: search ? [{ comment: Like(`%${search}%`) }] : {},
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
      relations: ['product', 'votes']
    });
    const response = {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
    console.log('data lay tu DB');
    return response;
  }

  async findByProduct(productId: number) {
    const reviews = await this.reviewsRepository.find({
      where: { product: { id: productId }, status: ReviewStatus.APPROVED },
      relations: ['user', 'images', 'votes'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      user: {
        id: r.user.id,
        name: r.user.fullName,
      },
      images: r.images.map((img) => img.imageUrl),
      helpfulCount: r.votes.filter((v) => v.isHelpful).length,
      createdAt: r.createdAt,
    }));
  }

  async approve(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, {
        where: {id},
        relations: ['product']
      })
      if (!review) throw new HttpException('Review not found', HttpStatus.NOT_FOUND)

      if (review.status === ReviewStatus.APPROVED) 
        throw new HttpException('Review has already been approved', HttpStatus.BAD_REQUEST);
      
      review.status = ReviewStatus.APPROVED
      await manager.save(review)

      await this.updateProductRating(manager, review.product.id)
      await this.redis.del(`review:summary:${review.product.id}`); // clear cache

      await this.notificationService.create({
        title: 'Review approved',
        message: `Review for product #${review.product.id} has been approved`,
        userId: review.user.id,
      })
      return review
    })
  }

  async reject(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, {
        where: {id},
      })
      if (!review) throw new HttpException('Review not found', HttpStatus.NOT_FOUND)

      if (review.status === ReviewStatus.REJECTED) 
        throw new HttpException('Review has already been rejected', HttpStatus.BAD_REQUEST);
      
      review.status = ReviewStatus.REJECTED
      await manager.save(review)

      await this.updateProductRating(manager, review.product.id)
      await this.redis.del(`review:summary:${review.product.id}`);

      await this.notificationService.create({
        title: 'Review rejected',
        message: `Review for product #${review.product.name} has been rejected`,
        userId: review.user.id,
      })
      return review
    })
  }

  async vote(reviewId: number, userId: number, voteReviewDto: VoteReviewDto) {
    return await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, {
        where: {id: reviewId},
        relations: ['user']
      })
      if (!review) throw new HttpException('Review not found', HttpStatus.NOT_FOUND)

      if (review.user.id === userId)
        throw new HttpException('You cannot vote for your own review', HttpStatus.BAD_REQUEST);

      const user = await manager.findOne(User, {
        where: {id: userId}
      })
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

      const existingVote = await manager.findOne(ReviewVote, {
        where: {review: {id: reviewId}, user: {id: userId}}
      })
      if (existingVote) {
        existingVote.isHelpful = voteReviewDto.isHelpful
        await manager.save(existingVote)
        return {
          message: 'Vote updated successfully',
          reviewId,
          userId,
          isHelpful: existingVote.isHelpful
        }
      }

      const newNote = manager.create(ReviewVote, {
        review,
        user,
        isHelpful: voteReviewDto.isHelpful
      })
      await manager.save(newNote)
      return {
        message: 'Vote created successfully',
        reviewId,
        userId,
        isHelpful: newNote.isHelpful
      }
    })
  }

  async getReviewSummary(productId: number) {
    const cachedKey = `review:summary:${productId}`;
    const cached = await this.redis.get(cachedKey);

    if (cached) return JSON.parse(cached);

    const summary = await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

      const results = await manager
        .createQueryBuilder(Review, 'r')
        .select('ROUND(r.rating)', 'rating')
        .addSelect('COUNT(r.id)', 'count')
        .where('r.product = :productId', { productId })
        .andWhere('r.status = :status', { status: ReviewStatus.APPROVED })
        .groupBy('ROUND(r.rating)')
        .getRawMany();

      const total = results.reduce((sum, r) => sum + Number(r.count), 0);
      const weightedSum = results.reduce(
        (sum, r) => sum + Number(r.count) * Number(r.rating),
        0,
      );
      const avg = total > 0 ? weightedSum / total : 0;

      const distribution = Object.fromEntries(
        [5, 4, 3, 2, 1].map((star) => [
          star,
          Number(results.find((r) => Number(r.rating) === star)?.count ?? 0),
        ]),
      );

      return {
        productId,
        reviewCount: total,
        averageRating: +avg.toFixed(1),
        distribution,
      };
    })

    // cache trong 5 mins
    await this.redis.set(cachedKey, JSON.stringify(summary), 'EX', 60*5);
    return summary;
  }

  async updateReview(reviewId: number, userId: number, dto: UpdateReviewDto, images: Array<Express.Multer.File>) {
    return await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, {
        where: {id: reviewId},
        relations: ['product', 'images']
      })
      if (!review) throw new HttpException('Review not found', HttpStatus.NOT_FOUND)

      if (review.status === ReviewStatus.APPROVED || review.status === ReviewStatus.REJECTED) 
        throw new HttpException('Review has already been approved or rejected', HttpStatus.BAD_REQUEST);

      if (dto.rating !== undefined) review.rating = dto.rating;
      if (dto.comment !== undefined) review.comment = dto.comment;
      await manager.save(review);

      // xóa ảnh
      if (review.images?.length){
        for (const img of review.images) {
          if (img.publicId){
            try {
              await this.cloudinaryService.deleteFile(img.publicId);
            }
            catch { /* empty */ }
          }
        }
        await manager.delete(ReviewImage, {review: {id: review.id}});
      }

      if (images?.length > 0){
        const uploads = await Promise.all(
          images.map((image) => this.cloudinaryService.uploadFile(image)),
        );

        const newImages = uploads.map((u) => manager.create(ReviewImage, {
          review,
          imageUrl: u?.secure_url,
          publicId: u?.public_id,
        }))

        await manager.save(newImages);
        review.images = newImages;
      }
      await this.updateProductRating(manager, review.product.id)
      await this.redis.del(`review:summary:${review.product.id}`); // clear cache

      return {
        ...review,
        message: "Review updated successfully"
      }
    })
  }

  async deleteReview(reviewId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, {
        where: { id: reviewId, user: { id: userId } },
        relations: ['images', 'product'],
      });

      if (!review)
        throw new HttpException(
          'Review not found or unauthorized',
          HttpStatus.NOT_FOUND,
        );

      // Không cho xoá nếu review đã được admin duyệt
      if (review.status === ReviewStatus.APPROVED) {
        throw new HttpException(
          'Approved reviews cannot be deleted',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Xoá ảnh Cloudinary
      if (review.images?.length) {
        for (const img of review.images) {
          if (img.publicId) {
            try {
              await this.cloudinaryService.deleteFile(img.publicId);
            } catch {
              /*  */
            }
          }
        }
        await manager.delete(ReviewImage, { review: { id: review.id } });
      }

      // Xoá vote liên quan (nếu có)
      await manager.delete(ReviewVote, { review: { id: review.id } });

      // Xoá review chính
      await manager.delete(Review, { id: review.id });

      // cập nhật lại average rating của product
      await this.updateProductRating(manager, review.product.id);
      await this.redis.del(`review:summary:${review.product.id}`); // clear cache
      return { message: 'Review deleted successfully' };
    });
  }
}
