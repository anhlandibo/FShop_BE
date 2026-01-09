/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not, IsNull, LessThan, MoreThan } from 'typeorm';
import { Livestream, LivestreamMessage, LivestreamView, LivestreamPinnedProduct } from './entities';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateLivestreamDto } from './dtos/create-livestream.dto';
import { UpdateLivestreamDto } from './dtos/update-livestream.dto';
import { QueryLivestreamDto } from './dtos/query-livestream.dto';
import { LivestreamStatus } from 'src/constants';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'src/constants/notification-type.enum';import { CloudinaryService } from '../cloudinary/cloudinary.service';import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LivestreamsService {
  constructor(
    @InjectRepository(Livestream)
    private livestreamRepo: Repository<Livestream>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(LivestreamMessage)
    private messageRepo: Repository<LivestreamMessage>,
    @InjectRepository(LivestreamView)
    private viewRepo: Repository<LivestreamView>,
    @InjectRepository(LivestreamPinnedProduct)
    private pinnedProductRepo: Repository<LivestreamPinnedProduct>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationService: NotificationsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async updateViewerHeartbeat(
    livestreamId: number,
    userId: number | null,
    guestId?: string,
  ) {
    const whereCondition: any = {
      livestream: { id: livestreamId },
      leftAt: IsNull(),
    };

    if (userId) {
      whereCondition.user = { id: userId };
    } else if (guestId) {
      whereCondition.guestId = guestId;
    }

    const view = await this.viewRepo.findOne({ where: whereCondition });

    if (view) {
      // Update last activity timestamp
      view.lastActivityAt = new Date();
      await this.viewRepo.save(view);

      console.log(
        `[Service] Heartbeat updated for viewer in livestream ${livestreamId}`,
      );
    }
  }

  // UPLOAD THUMBNAIL TO CLOUDINARY
  async uploadThumbnail(thumbnailFile: Express.Multer.File) {
    const uploadResult = await this.cloudinaryService.uploadFileToFolder(
      thumbnailFile,
      'livestreams/thumbnails',
      'image',
    );
    if (!uploadResult) {
      throw new HttpException(
        'Failed to upload thumbnail',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      url: uploadResult?.secure_url,
      publicId: uploadResult?.public_id,
    };
  }

  // CREATE LIVESTREAM
  async createLivestream(
    user: User,
    createDto: CreateLivestreamDto,
    thumbnailFile?: Express.Multer.File,
  ) {
    const { title, description, productIds, scheduledAt, thumbnailUrl } =
      createDto;
    let products: Product[] = [];

    if (productIds && productIds.length > 0) {
      products = await this.productRepo.find({
        where: { id: In(productIds) },
      });

      if (products.length !== productIds.length) {
        throw new HttpException(
          'Some products not found',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const streamKey = `live_${uuidv4().split('-')[0]}`;

    // Upload thumbnail nếu có file
    let finalThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      const uploadResult = await this.cloudinaryService.uploadFileToFolder(
        thumbnailFile,
        'livestreams/thumbnails',
        'image',
      );
      if (uploadResult) {
        finalThumbnailUrl = uploadResult.secure_url;
      }
    }

    const stream = this.livestreamRepo.create({
      title,
      description,
      streamKey,
      status: LivestreamStatus.Scheduled,
      isActive: false,
      scheduledAt,
      thumbnailUrl: finalThumbnailUrl,
      user,
      products,
    });

    return this.livestreamRepo.save(stream);
  }

  // UPDATE LIVESTREAM
  async updateLivestream(
    id: number,
    user: User,
    updateDto: UpdateLivestreamDto,
    thumbnailFile?: Express.Multer.File,
  ) {
    const stream = await this.livestreamRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!stream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    if (stream.user.id !== user.id) {
      throw new HttpException(
        'You are not authorized to update this livestream',
        HttpStatus.FORBIDDEN,
      );
    }

    if (stream.status === LivestreamStatus.Live) {
      throw new HttpException(
        'Cannot update livestream while it is live',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { title, description, productIds, scheduledAt, thumbnailUrl } =
      updateDto;

    if (title) stream.title = title;
    if (description !== undefined) stream.description = description;
    if (scheduledAt !== undefined) stream.scheduledAt = scheduledAt;
    if (thumbnailUrl !== undefined) stream.thumbnailUrl = thumbnailUrl;

    // Upload thumbnail mới nếu có file
    if (thumbnailFile) {
      const uploadResult = await this.cloudinaryService.uploadFileToFolder(
        thumbnailFile,
        'livestreams/thumbnails',
        'image',
      );
      if (uploadResult) {
        stream.thumbnailUrl = uploadResult.secure_url;
      }
    }

    if (productIds) {
      const products = await this.productRepo.find({
        where: { id: In(productIds) },
      });

      if (products.length !== productIds.length) {
        throw new HttpException(
          'Some products not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      stream.products = products;
    }

    return this.livestreamRepo.save(stream);
  }

  // DELETE/CANCEL LIVESTREAM
  async deleteLivestream(id: number, user: User) {
    const stream = await this.livestreamRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!stream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    if (stream.user.id !== user.id) {
      throw new HttpException(
        'You are not authorized to delete this livestream',
        HttpStatus.FORBIDDEN,
      );
    }

    if (stream.status === LivestreamStatus.Live) {
      throw new HttpException(
        'Cannot delete livestream while it is live. Please end it first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    stream.status = LivestreamStatus.Cancelled;
    await this.livestreamRepo.save(stream);

    return { message: 'Livestream cancelled successfully' };
  }

  // END LIVESTREAM MANUALLY
  async endLivestream(id: number, user: User) {
    const stream = await this.livestreamRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!stream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    if (stream.user.id !== user.id) {
      throw new HttpException(
        'You are not authorized to end this livestream',
        HttpStatus.FORBIDDEN,
      );
    }

    if (stream.status !== LivestreamStatus.Live) {
      throw new HttpException(
        'Livestream is not currently live',
        HttpStatus.BAD_REQUEST,
      );
    }

    stream.status = LivestreamStatus.Ended;
    stream.isActive = false;
    stream.endedAt = new Date();
    stream.currentViewers = 0;

    return this.livestreamRepo.save(stream);
  }

  // GET ACTIVE/LIVE LIVESTREAMS
  async getActiveLivestreams(): Promise<Livestream[]> {
    return this.livestreamRepo.find({
      where: { status: LivestreamStatus.Live, isActive: true },
      relations: ['user', 'products'],
      select: {
        user: { id: true, fullName: true, avatar: true },
      },
      order: { currentViewers: 'DESC', updatedAt: 'DESC' },
    });
  }

  // GET ALL LIVESTREAMS WITH FILTER
  async getAllLivestreams(query: QueryLivestreamDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      userId,
    } = query;

    const whereCondition: any = {};
    if (status) whereCondition.status = status;
    if (userId) whereCondition.user = { id: userId };

    const [data, total] = await this.livestreamRepo.findAndCount({
      where: whereCondition,
      relations: ['user', 'products'],
      select: {
        user: { id: true, fullName: true, avatar: true },
      },
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET MY LIVESTREAMS
  async getMyLivestreams(user: User, query: QueryLivestreamDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
    } = query;

    const whereCondition: any = { user: { id: user.id } };
    if (status) whereCondition.status = status;

    const [data, total] = await this.livestreamRepo.findAndCount({
      where: whereCondition,
      relations: ['products'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET LIVESTREAM BY ID
  async getLivestream(
    id: number,
  ): Promise<Livestream & { messageCount: number }> {
    const stream = await this.livestreamRepo.findOne({
      where: { id },
      relations: ['user', 'products', 'products.images'],
    });
    if (!stream)
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);

    const messageCount = await this.messageRepo.count({
      where: {
        livestream: { id },
        isDeleted: false,
      },
    });

    return {
      ...stream,
      messageCount,
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupStaleViewers() {
    console.log('[Cleanup] Starting stale viewer cleanup...');

    // Find views where lastActivityAt is older than 2 minutes (missed 4 heartbeats)
    const staleThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes

    const staleViews = await this.viewRepo.find({
      where: {
        leftAt: IsNull(),
        lastActivityAt: LessThan(staleThreshold),
      },
      relations: ['livestream'],
    });

    for (const view of staleViews) {
      view.leftAt = new Date();
      view.watchDuration = Math.floor(
        (view.leftAt.getTime() - view.joinedAt.getTime()) / 1000,
      );
      await this.viewRepo.save(view);

      // Decrement viewer count
      const livestream = view.livestream;
      if (livestream && livestream.currentViewers > 0) {
        livestream.currentViewers -= 1;
        await this.livestreamRepo.save(livestream);
      }
    }

    console.log(`[Cleanup] Cleaned up ${staleViews.length} stale viewers`);
  }

  // GET LIVESTREAM BY STREAM KEY
  async getLivestreamByStreamKey(streamKey: string): Promise<Livestream> {
    const stream = await this.livestreamRepo.findOne({
      where: { streamKey },
      relations: ['user', 'products'],
    });
    if (!stream)
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    return stream;
  }

  // VERIFY STREAM KEY (used by media server)
  async verifyStreamKey(streamKey: string): Promise<boolean> {
    const stream = await this.livestreamRepo.findOne({ where: { streamKey } });
    return !!stream;
  }

  // UPDATE STREAM STATUS (used by media server)
  async updateStreamStatus(streamKey: string, isActive: boolean) {
    const stream = await this.livestreamRepo.findOne({
      where: { streamKey },
      relations: ['user'],
    });

    if (stream) {
      stream.isActive = isActive;

      if (isActive) {
        stream.status = LivestreamStatus.Live;
        stream.startedAt = new Date();

        // Send notification to followers/all users (simplified - send to all)
        await this.notificationService.sendToAll(
          'Livestream Started',
          `${stream.user.fullName} is now live: ${stream.title}`,
          NotificationType.LivestreamStarted,
        );
      } else {
        if (stream.status === LivestreamStatus.Live) {
          stream.status = LivestreamStatus.Ended;
          stream.endedAt = new Date();
          stream.currentViewers = 0;
        }
      }

      await this.livestreamRepo.save(stream);
    }
  }

  // ====== VIEWER TRACKING ======

  async trackViewerJoin(
    livestreamId: number,
    user: User | null,
    guestId?: string,
  ) {
    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
    });
    if (!livestream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    // Check if already viewing (to prevent duplicate tracking)
    const existingView = await this.viewRepo.findOne({
      where: {
        livestream: { id: livestreamId },
        ...(user ? { user: { id: user.id } } : { guestId }),
        leftAt: IsNull(),
      },
    });

    if (existingView) {
      return existingView; // Already tracking
    }

    const view = this.viewRepo.create({
      livestream,
      user,
      guestId: user ? null : guestId || null,
      joinedAt: new Date(),
    });

    await this.viewRepo.save(view);

    // Increment current viewers
    livestream.currentViewers += 1;
    livestream.totalViews += 1;

    if (livestream.currentViewers > livestream.peakViewers) {
      livestream.peakViewers = livestream.currentViewers;
    }

    await this.livestreamRepo.save(livestream);

    return view;
  }

  async trackViewerLeave(
    livestreamId: number,
    user: User | null,
    guestId?: string,
  ) {
    const view = await this.viewRepo.findOne({
      where: {
        livestream: { id: livestreamId },
        ...(user ? { user: { id: user.id } } : { guestId }),
        leftAt: IsNull(),
      },
    });

    if (!view) {
      return null;
    }

    view.leftAt = new Date();
    view.watchDuration = Math.floor(
      (view.leftAt.getTime() - view.joinedAt.getTime()) / 1000,
    );

    await this.viewRepo.save(view);

    // Decrement current viewers
    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
    });
    if (livestream && livestream.currentViewers > 0) {
      livestream.currentViewers -= 1;
      await this.livestreamRepo.save(livestream);
    }

    return view;
  }

  async getCurrentViewerCount(livestreamId: number): Promise<number> {
    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
      select: ['currentViewers'],
    });

    return livestream ? livestream.currentViewers : 0;
  }

  // ====== CHAT MESSAGES ======

  async saveMessage(livestreamId: number, user: User, content: string) {
    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
    });
    if (!livestream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    const message = this.messageRepo.create({
      livestream,
      user,
      content,
    });

    return this.messageRepo.save(message);
  }

  async getMessages(livestreamId: number, limit: number = 50) {
    return this.messageRepo.find({
      where: { livestream: { id: livestreamId }, isDeleted: false },
      relations: ['user'],
      select: {
        user: { id: true, fullName: true, avatar: true },
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteMessage(messageId: number, user: User) {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['user', 'livestream', 'livestream.user'],
    });

    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    // Allow message owner or livestream owner to delete
    if (message.user.id !== user.id && message.livestream.user.id !== user.id) {
      throw new HttpException(
        'You are not authorized to delete this message',
        HttpStatus.FORBIDDEN,
      );
    }

    message.isDeleted = true;
    return this.messageRepo.save(message);
  }

  async pinMessage(messageId: number, user: User) {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['livestream', 'livestream.user'],
    });

    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    if (message.livestream.user.id !== user.id) {
      throw new HttpException(
        'Only livestream owner can pin messages',
        HttpStatus.FORBIDDEN,
      );
    }

    message.isPinned = true;
    return this.messageRepo.save(message);
  }

  // ====== PINNED PRODUCTS ======

  async pinProduct(livestreamId: number, productId: number, user: User) {
    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
      relations: ['user', 'products'],
    });

    if (!livestream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    if (livestream.user.id !== user.id) {
      throw new HttpException(
        'Only livestream owner can pin products',
        HttpStatus.FORBIDDEN,
      );
    }

    const product = livestream.products.find((p) => p.id === productId);
    if (!product) {
      throw new HttpException(
        'Product not in livestream',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if already pinned and active
    const existingPin = await this.pinnedProductRepo.findOne({
      where: {
        livestream: { id: livestreamId },
        product: { id: productId },
        unpinnedAt: IsNull(),
      },
    });

    if (existingPin) {
      throw new HttpException('Product already pinned', HttpStatus.BAD_REQUEST);
    }

    const pinnedProduct = this.pinnedProductRepo.create({
      livestream,
      product,
      pinnedAt: new Date(),
    });

    return this.pinnedProductRepo.save(pinnedProduct);
  }

  async unpinProduct(livestreamId: number, productId: number, user: User) {
    const pinnedProduct = await this.pinnedProductRepo.findOne({
      where: {
        livestream: { id: livestreamId },
        product: { id: productId },
        unpinnedAt: IsNull(),
      },
      relations: ['livestream', 'livestream.user'],
    });

    if (!pinnedProduct) {
      throw new HttpException('Pinned product not found', HttpStatus.NOT_FOUND);
    }

    if (pinnedProduct.livestream.user.id !== user.id) {
      throw new HttpException(
        'Only livestream owner can unpin products',
        HttpStatus.FORBIDDEN,
      );
    }

    pinnedProduct.unpinnedAt = new Date();
    return this.pinnedProductRepo.save(pinnedProduct);
  }

  async getCurrentPinnedProducts(livestreamId: number) {
    return this.pinnedProductRepo.find({
      where: {
        livestream: { id: livestreamId },
        unpinnedAt: IsNull(),
      },
      relations: ['product', 'product.images'],
      order: { pinnedAt: 'DESC' },
    });
  }

  async trackProductClick(livestreamId: number, productId: number) {
    const pinnedProduct = await this.pinnedProductRepo.findOne({
      where: {
        livestream: { id: livestreamId },
        product: { id: productId },
        unpinnedAt: IsNull(),
      },
    });

    if (pinnedProduct) {
      pinnedProduct.clickCount += 1;
      await this.pinnedProductRepo.save(pinnedProduct);
    }
  }

  async trackProductAddToCart(livestreamId: number, productId: number) {
    const pinnedProduct = await this.pinnedProductRepo.findOne({
      where: {
        livestream: { id: livestreamId },
        product: { id: productId },
      },
    });

    if (pinnedProduct) {
      pinnedProduct.addToCartCount += 1;
      await this.pinnedProductRepo.save(pinnedProduct);
    }
  }

  // ====== ANALYTICS ======

  async getLivestreamAnalytics(id: number, user: User) {
    const livestream = await this.livestreamRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!livestream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    if (livestream.user.id !== user.id) {
      throw new HttpException(
        'You are not authorized to view analytics',
        HttpStatus.FORBIDDEN,
      );
    }

    const totalMessages = await this.messageRepo.count({
      where: { livestream: { id }, isDeleted: false },
    });

    const pinnedProducts = await this.pinnedProductRepo.find({
      where: { livestream: { id } },
      relations: ['product'],
    });

    const totalClicks = pinnedProducts.reduce(
      (sum, pp) => sum + pp.clickCount,
      0,
    );
    const totalAddToCarts = pinnedProducts.reduce(
      (sum, pp) => sum + pp.addToCartCount,
      0,
    );

    const views = await this.viewRepo.find({
      where: { livestream: { id }, leftAt: Not(IsNull()) },
    });

    const avgWatchDuration =
      views.length > 0
        ? views.reduce((sum, v) => sum + v.watchDuration, 0) / views.length
        : 0;

    return {
      livestream: {
        id: livestream.id,
        title: livestream.title,
        status: livestream.status,
        startedAt: livestream.startedAt,
        endedAt: livestream.endedAt,
      },
      viewers: {
        total: livestream.totalViews,
        peak: livestream.peakViewers,
        current: livestream.currentViewers,
        avgWatchDuration: Math.floor(avgWatchDuration),
      },
      engagement: {
        totalMessages,
        totalProductClicks: totalClicks,
        totalAddToCarts: totalAddToCarts,
      },
      products: pinnedProducts.map((pp) => ({
        productId: pp.product.id,
        productName: pp.product.name,
        clicks: pp.clickCount,
        addToCarts: pp.addToCartCount,
        pinnedAt: pp.pinnedAt,
        unpinnedAt: pp.unpinnedAt,
      })),
    };
  }

  // ====== GATEWAY WRAPPER METHODS (using userId instead of User entity) ======

  async saveMessageByUserId(
    livestreamId: number,
    userId: number,
    content: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.saveMessage(livestreamId, user, content);
  }

  async pinProductByUserId(
    livestreamId: number,
    productId: number,
    userId: number,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.pinProduct(livestreamId, productId, user);
  }

  async unpinProductByUserId(
    livestreamId: number,
    productId: number,
    userId: number,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.unpinProduct(livestreamId, productId, user);
  }

  async deleteMessageByUserId(messageId: number, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.deleteMessage(messageId, user);
  }

  async pinMessageByUserId(messageId: number, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.pinMessage(messageId, user);
  }

  async trackViewerJoinByUserId(
    livestreamId: number,
    userId: number | null,
    guestId?: string,
  ) {
    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
    });
    if (!livestream) {
      throw new HttpException('Livestream not found', HttpStatus.NOT_FOUND);
    }

    let user: User | null = null;
    if (userId) {
      user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
    }

    // ✅ Check for ACTIVE view first (leftAt is NULL)
    const whereCondition: any = {
      livestream: { id: livestreamId },
      leftAt: IsNull(),
    };

    if (user) {
      whereCondition.user = { id: user.id };
    } else if (guestId) {
      whereCondition.guestId = guestId;
    }

    const activeView = await this.viewRepo.findOne({ where: whereCondition });

    if (activeView) {
      console.log(
        '[LivestreamService] Viewer already active, updating lastActivityAt',
      );
      // Just update heartbeat, don't increment anything
      activeView.lastActivityAt = new Date();
      await this.viewRepo.save(activeView);
      return activeView;
    }

    // ✅ Check for RECENT session (within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentSessionWhere: any = {
      livestream: { id: livestreamId },
      // leftAt: Not(IsNull()), // Has left
      leftAt: MoreThan(thirtyMinutesAgo), // But left less than 30 min ago
    };

    if (user) {
      recentSessionWhere.user = { id: user.id };
    } else if (guestId) {
      recentSessionWhere.guestId = guestId;
    }

    const recentSession = await this.viewRepo.findOne({
      where: recentSessionWhere,
    });

    // ✅ Determine if this should count as a new unique view
    const shouldCountAsNewView = !recentSession;

    console.log('[LivestreamService] Join check:', {
      hasRecentSession: !!recentSession,
      willCountAsNewView: shouldCountAsNewView,
    });

    // Create new view record
    const view = this.viewRepo.create({
      livestream,
      user,
      guestId: user ? null : guestId || null,
      joinedAt: new Date(),
      lastActivityAt: new Date(),
    });

    await this.viewRepo.save(view);

    // ✅ Get actual active viewer count from database
    const activeViewerCount = await this.viewRepo.count({
      where: {
        livestream: { id: livestreamId },
        leftAt: IsNull(),
      },
    });

    livestream.currentViewers = activeViewerCount;

    // ✅ ONLY increment totalViews if no recent session (true unique view)
    if (shouldCountAsNewView) {
      livestream.totalViews += 1;
      console.log('[LivestreamService] ✅ Counted as NEW unique view');
    } else {
      console.log(
        '[LivestreamService] ⏭️ Same session continuing - NOT counted as new view',
      );
    }

    if (livestream.currentViewers > livestream.peakViewers) {
      livestream.peakViewers = livestream.currentViewers;
    }

    await this.livestreamRepo.save(livestream);

    console.log(
      `[LivestreamService] Viewer joined. Active: ${activeViewerCount}, Total: ${livestream.totalViews}`,
    );
    return view;
  }

  async trackViewerLeaveByUserId(
    livestreamId: number,
    userId: number | null,
    guestId?: string,
  ) {
    let user: User | null = null;
    if (userId) {
      user = await this.userRepo.findOne({ where: { id: userId } });
    }

    const whereCondition: any = {
      livestream: { id: livestreamId },
      leftAt: IsNull(),
    };

    if (user) {
      whereCondition.user = { id: user.id };
    } else if (guestId) {
      whereCondition.guestId = guestId;
    }

    const view = await this.viewRepo.findOne({ where: whereCondition });

    if (!view) {
      console.log('[LivestreamService] No active view found to leave');
      return null;
    }

    view.leftAt = new Date();
    view.watchDuration = Math.floor(
      (view.leftAt.getTime() - view.joinedAt.getTime()) / 1000,
    );

    await this.viewRepo.save(view);

    // ✅ FIX: Get actual active viewer count from database
    const activeViewerCount = await this.viewRepo.count({
      where: {
        livestream: { id: livestreamId },
        leftAt: IsNull(),
      },
    });

    const livestream = await this.livestreamRepo.findOne({
      where: { id: livestreamId },
    });
    if (livestream) {
      livestream.currentViewers = activeViewerCount;
      await this.livestreamRepo.save(livestream);
    }

    console.log(
      `[LivestreamService] Viewer left. Active viewers: ${activeViewerCount}`,
    );
    return view;
  }
}
