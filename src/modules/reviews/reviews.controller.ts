/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { request } from 'http';
import { QueryDto } from 'src/dto/query.dto';
import { VoteReviewDto } from './dto/vote-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { TopReviewsDto } from './dto/top-reviews.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiNotFoundResponse({ description: 'Product or user not found' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  async create(
    @Req() request: Request,
    @Body() dto: CreateReviewDto,
    @UploadedFiles()
    files: { images?: Express.Multer.File[] },
  ) {
    const {id} = request['user']
    return this.reviewsService.create(dto, id, files.images ?? []);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  findAll(@Query() query: QueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top-k reviews with highest ratings' })
  getTopReviews(@Query() query: TopReviewsDto) {
    return this.reviewsService.getTopReviewsByRating(query);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all reviews by product' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findByProduct(@Param('productId') productId: number) {
    return this.reviewsService.findByProduct(productId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a review' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  approve(@Param('id') id: number) {
    return this.reviewsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a review' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  reject(@Param('id') id: number) {
    return this.reviewsService.reject(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/vote')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote for a review' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  vote(@Req() request: Request, @Param('id') id: number, @Body() voteReviewDto: VoteReviewDto) {
    const {userId} = request['user']
    return this.reviewsService.vote(id, userId, voteReviewDto);
  }

  @Get('summary/:productId')
  @ApiOperation({ summary: 'Get review summary for a product' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async getReviewSummary(@Param('productId') productId: number) {
    return this.reviewsService.getReviewSummary(productId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing review (rating, comment, images)' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  updateReview(
    @Req() request: Request,
    @Param('id') id: number,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles()
    files: { images?: Express.Multer.File[] },
  ) {
    const { userId } = request['user']
    return this.reviewsService.updateReview(id, userId, dto, files.images ?? []);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (soft delete)' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  deleteReview(@Param('id') id: number, @Req() request: Request) {
    const { userId } = request['user']
    return this.reviewsService.deleteReview(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a deleted review' })
  @ApiNotFoundResponse({ description: 'Deleted review not found' })
  restoreReview(@Param('id') id: number, @Req() request: Request) {
    const { userId } = request['user']
    return this.reviewsService.restoreReview(id, userId);
  }
}
