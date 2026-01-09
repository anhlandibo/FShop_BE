/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req, Query, ParseIntPipe, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { LivestreamsService } from './livestreams.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateLivestreamDto } from './dtos/create-livestream.dto';
import { UpdateLivestreamDto } from './dtos/update-livestream.dto';
import { QueryLivestreamDto } from './dtos/query-livestream.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('livestreams')
export class LivestreamsController {
  constructor(private readonly livestreamService: LivestreamsService) {}

  // CREATE LIVESTREAM
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Req() req,
    @Body() createLivestreamDto: CreateLivestreamDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const user = req.user;
    return this.livestreamService.createLivestream(user, createLivestreamDto, thumbnail);
  }

  // UPLOAD THUMBNAIL FOR LIVESTREAM
  @Post('upload-thumbnail')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('thumbnail'))
  async uploadThumbnail(@UploadedFile() thumbnail: Express.Multer.File) {
    if (!thumbnail) {
      throw new HttpException('Thumbnail file is required', HttpStatus.BAD_REQUEST);
    }
    return this.livestreamService.uploadThumbnail(thumbnail);
  }

  // GET ALL LIVESTREAMS WITH FILTERS
  @Get()
  async getAll(@Query() query: QueryLivestreamDto) {
    return this.livestreamService.getAllLivestreams(query);
  }

  // GET ACTIVE/LIVE LIVESTREAMS
  @Get('active')
  async getActive() {
    return this.livestreamService.getActiveLivestreams();
  }

  // GET MY LIVESTREAMS
  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyLivestreams(@Req() req, @Query() query: QueryLivestreamDto) {
    const user = req.user;
    return this.livestreamService.getMyLivestreams(user, query);
  }

  // GET LIVESTREAM BY ID
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.livestreamService.getLivestream(id);
  }

  // UPDATE LIVESTREAM
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() updateDto: UpdateLivestreamDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const user = req.user;
    return this.livestreamService.updateLivestream(id, user, updateDto, thumbnail);
  }

  // DELETE/CANCEL LIVESTREAM
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;
    return this.livestreamService.deleteLivestream(id, user);
  }

  // END LIVESTREAM MANUALLY
  @Post(':id/end')
  @UseGuards(AuthGuard('jwt'))
  async endLivestream(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;
    return this.livestreamService.endLivestream(id, user);
  }

  // GET LIVESTREAM ANALYTICS
  @Get(':id/analytics')
  @UseGuards(AuthGuard('jwt'))
  async getAnalytics(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;
    return this.livestreamService.getLivestreamAnalytics(id, user);
  }

  // GET CHAT MESSAGES
  @Get(':id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ) {
    return this.livestreamService.getMessages(id, limit);
  }

  // DELETE MESSAGE
  @Delete('messages/:messageId')
  @UseGuards(AuthGuard('jwt'))
  async deleteMessage(@Param('messageId', ParseIntPipe) messageId: number, @Req() req) {
    const user = req.user;
    return this.livestreamService.deleteMessage(messageId, user);
  }

  // PIN MESSAGE
  @Post('messages/:messageId/pin')
  @UseGuards(AuthGuard('jwt'))
  async pinMessage(@Param('messageId', ParseIntPipe) messageId: number, @Req() req) {
    const user = req.user;
    return this.livestreamService.pinMessage(messageId, user);
  }

  // PIN PRODUCT
  @Post(':id/products/:productId/pin')
  @UseGuards(AuthGuard('jwt'))
  async pinProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req,
  ) {
    const user = req.user;
    return this.livestreamService.pinProduct(id, productId, user);
  }

  // UNPIN PRODUCT
  @Post(':id/products/:productId/unpin')
  @UseGuards(AuthGuard('jwt'))
  async unpinProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req,
  ) {
    const user = req.user;
    return this.livestreamService.unpinProduct(id, productId, user);
  }

  // GET CURRENTLY PINNED PRODUCTS
  @Get(':id/products/pinned')
  async getPinnedProducts(@Param('id', ParseIntPipe) id: number) {
    return this.livestreamService.getCurrentPinnedProducts(id);
  }

  // TRACK PRODUCT CLICK
  @Post(':id/products/:productId/click')
  async trackProductClick(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.livestreamService.trackProductClick(id, productId);
    return { success: true };
  }

  // TRACK PRODUCT ADD TO CART
  @Post(':id/products/:productId/add-to-cart')
  async trackProductAddToCart(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.livestreamService.trackProductAddToCart(id, productId);
    return { success: true };
  }

  // GET VIEWER COUNT
  @Get(':id/viewers/count')
  async getViewerCount(@Param('id', ParseIntPipe) id: number) {
    const count = await this.livestreamService.getCurrentViewerCount(id);
    return { count };
  }

  @Get('debug/stream-key/:streamKey')
  async debugStreamKey(@Param('streamKey') streamKey: string) {
  const stream = await this.livestreamService.getLivestreamByStreamKey(streamKey);
  return {
    found: !!stream,
    data: stream ? {
      id: stream.id,
      title: stream.title,
      status: stream.status,
      isActive: stream.isActive,
      streamKey: stream.streamKey,
      scheduledAt: stream.scheduledAt,
      startedAt: stream.startedAt,
    } : null,
  };
}
}
