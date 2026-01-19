import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like, In, ILike, EntityManager } from 'typeorm';
import { Post, PostImage, PostProduct, PostLike, PostComment, PostBookmark, PostShare, PostReaction } from './entities';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, UpdateCommentDto, QueryPostsDto, DeletePostsDto, RestorePostsDto } from './dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, ReactionType } from 'src/constants';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postsRepository: Repository<Post>,
    @InjectRepository(PostImage) private postImagesRepository: Repository<PostImage>,
    @InjectRepository(PostProduct) private postProductsRepository: Repository<PostProduct>,
    @InjectRepository(PostLike) private postLikesRepository: Repository<PostLike>,
    @InjectRepository(PostComment) private postCommentsRepository: Repository<PostComment>,
    @InjectRepository(PostBookmark) private postBookmarksRepository: Repository<PostBookmark>,
    @InjectRepository(PostShare) private postSharesRepository: Repository<PostShare>,
    @InjectRepository(PostReaction) private postReactionsRepository: Repository<PostReaction>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // CREATE POST
  async create(createPostDto: CreatePostDto, userId: number, images: Array<Express.Multer.File>) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Validate user exists
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      // 2. Validate products exist if productIds provided
      if (createPostDto.productIds && createPostDto.productIds.length > 0) {
        const products = await manager.find(Product, {
          where: { id: In(createPostDto.productIds) },
        });
        if (products.length !== createPostDto.productIds.length) {
          throw new HttpException('One or more products not found', HttpStatus.NOT_FOUND);
        }
      }

      // 3. Create post
      const post = manager.create(Post, {
        user,
        content: createPostDto.content,
        totalReactions: 0,
        totalComments: 0,
        reactionCounts: {
          LIKE: 0,
          LOVE: 0,
          HAHA: 0,
          WOW: 0,
          SAD: 0,
          ANGRY: 0,
        },
      });
      const savedPost = await manager.save(post);

      // 4. Upload images to Cloudinary
      if (images && images.length > 0) {
        const uploads = await Promise.all(images.map((image) => this.cloudinaryService.uploadFile(image)));
        const imgs = uploads.map((u) =>
          manager.create(PostImage, {
            post: savedPost,
            imageUrl: u?.secure_url,
            publicId: u?.public_id,
          }),
        );
        await manager.save(imgs);
        savedPost.images = imgs;
      }

      // 5. Create PostProduct relations (tag products)
      if (createPostDto.productIds && createPostDto.productIds.length > 0) {
        const postProducts = createPostDto.productIds.map((productId) =>
          manager.create(PostProduct, {
            post: savedPost,
            product: { id: productId },
          }),
        );
        await manager.save(postProducts);
        savedPost.postProducts = postProducts;
      }

      return savedPost;
    });
  }

  // GET FEED WITH PAGINATION
  async findAll(query: QueryPostsDto) {
    const { page, limit, search, sortType = 'newest', sortBy, sortOrder } = query;

    let orderBy: any = {};
    if (sortType === 'popular') orderBy = { totalReactions: 'DESC', createdAt: 'DESC' };
    else orderBy = { createdAt: 'DESC' };

    // If custom sortBy provided, override
    if (sortBy && sortOrder) orderBy = { [sortBy]: sortOrder };

    const [data, total] = await this.postsRepository.findAndCount({
      where: search ? { content: ILike(`%${search}%`), isActive: true } : { isActive: true },
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: orderBy,
      relations: ['user', 'images', 'postProducts', 'postProducts.product'],
    });

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
  }

  // GET POST DETAIL
  async findOne(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id, isActive: true },
      relations: ['user', 'images', 'postProducts', 'postProducts.product', 'comments', 'comments.user'],
    });
    if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    return post;
  }

  // UPDATE POST
  async update(postId: number, userId: number, updatePostDto: UpdatePostDto) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: true },
        relations: ['user'],
      });

      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      // Check ownership
      if (post.user.id !== userId) 
        throw new HttpException('You can only update your own posts', HttpStatus.FORBIDDEN);

      // Update content
      if (updatePostDto.content !== undefined) post.content = updatePostDto.content;

      // Update product tags
      if (updatePostDto.productIds !== undefined) {
        // Validate products
        if (updatePostDto.productIds.length > 0) {
          const products = await manager.find(Product, {
            where: { id: In(updatePostDto.productIds) },
          });
          if (products.length !== updatePostDto.productIds.length) {
            throw new HttpException('One or more products not found', HttpStatus.NOT_FOUND);
          }
        }

        // Delete old postProducts
        await manager.delete(PostProduct, { post: { id: postId } });

        // Create new postProducts
        if (updatePostDto.productIds.length > 0) {
          const postProducts = updatePostDto.productIds.map((productId) =>
            manager.create(PostProduct, {
              post,
              product: { id: productId },
            }),
          );
          await manager.save(postProducts);
        }
      }

      await manager.save(post);
      return { message: 'Post updated successfully', post };
    });
  }

  // DELETE POST (SOFT DELETE)
  async delete(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: true },
        relations: ['user'],
      });
      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      // Check ownership
      if (post.user.id !== userId)
        throw new HttpException('You can only delete your own posts', HttpStatus.FORBIDDEN);

      // Soft delete: set isActive to false
      post.isActive = false;
      await manager.save(post);

      return { message: 'Post deleted successfully' };
    });
  }

  // RESTORE POST
  async restore(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: false },
        relations: ['user'],
      });
      if (!post) throw new HttpException('Deleted post not found', HttpStatus.NOT_FOUND);

      // Check ownership
      if (post.user.id !== userId)
        throw new HttpException('You can only restore your own posts', HttpStatus.FORBIDDEN);

      // Restore: set isActive to true
      post.isActive = true;
      await manager.save(post);

      return { message: 'Post restored successfully', post };
    });
  }

  // TOGGLE LIKE (ADD/REMOVE) - Deprecated, use toggleReaction instead
  async toggleLike(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: true },
        relations: ['user'],
      });

      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const existingLike = await manager.findOne(PostLike, {
        where: { post: { id: postId }, user: { id: userId } },
      });

      if (existingLike) {
        // Unlike
        await manager.remove(existingLike);
        post.totalReactions = Math.max(0, post.totalReactions - 1);
        await manager.save(post);

        return {
          message: 'Post unliked',
          action: 'unliked',
          totalLikes: post.totalLikes, // Use getter for response
        };
      } else {
        // Like
        const user = await manager.findOne(User, { where: { id: userId } });
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const like = manager.create(PostLike, { post, user });
        await manager.save(like);

        post.totalReactions += 1;
        await manager.save(post);

        // Send notification to post owner
        await this.notificationsService.sendNotification(
          post.user.id,
          'Post Liked',
          `${user.fullName} liked your post`,
          NotificationType.POST,
        );

        return {
          message: 'Post liked',
          action: 'liked',
          totalLikes: post.totalLikes, // Use getter for response
        };
      }
    });
  }

  // TOGGLE REACTION (ADD/CHANGE/REMOVE) - New Facebook-style reactions
  async toggleReaction(postId: number, userId: number, type: ReactionType) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: true },
        relations: ['user'],
      });

      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      // Initialize reactionCounts if null (for backward compatibility with old posts)
      if (!post.reactionCounts) {
        post.reactionCounts = {
          LIKE: 0,
          LOVE: 0,
          HAHA: 0,
          WOW: 0,
          SAD: 0,
          ANGRY: 0,
        };
      }

      const existingReaction = await manager.findOne(PostReaction, {
        where: { post: { id: postId }, user: { id: userId } },
      });

      if (existingReaction) {
        if (existingReaction.type === type) {
          // Remove reaction (toggle off)
          await manager.remove(existingReaction);
          post.totalReactions = Math.max(0, post.totalReactions - 1);
          post.reactionCounts[type] = Math.max(0, post.reactionCounts[type] - 1);
          await manager.save(post);

          return {
            message: 'Reaction removed',
            action: 'removed',
            totalReactions: post.totalReactions,
            reactionCounts: post.reactionCounts,
          };
        } else {
          // Change reaction type
          const oldType = existingReaction.type;
          existingReaction.type = type;
          await manager.save(existingReaction);

          post.reactionCounts[oldType] = Math.max(0, post.reactionCounts[oldType] - 1);
          post.reactionCounts[type] = (post.reactionCounts[type] || 0) + 1;
          await manager.save(post);

          return {
            message: 'Reaction changed',
            action: 'changed',
            from: oldType,
            to: type,
            totalReactions: post.totalReactions,
            reactionCounts: post.reactionCounts,
          };
        }
      } else {
        // Add new reaction
        const user = await manager.findOne(User, { where: { id: userId } });
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const reaction = manager.create(PostReaction, { post, user, type });
        await manager.save(reaction);

        post.totalReactions = (post.totalReactions || 0) + 1;
        post.reactionCounts[type] = (post.reactionCounts[type] || 0) + 1;
        await manager.save(post);

        // Send notification to post owner (only when adding new reaction, not the owner)
        if (post.user.id !== userId) {
          await this.notificationsService.sendNotification(
            post.user.id,
            'New Reaction',
            `${user.fullName} reacted ${type} to your post`,
            NotificationType.POST,
          );
        }

        return {
          message: 'Reaction added',
          action: 'added',
          type,
          totalReactions: post.totalReactions,
          reactionCounts: post.reactionCounts,
        };
      }
    });
  }

  // ADD COMMENT (ROOT COMMENT ONLY)
  async addComment(postId: number, userId: number, createCommentDto: CreateCommentDto) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: true },
        relations: ['user'],
      });

      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const comment = manager.create(PostComment, {
        post,
        user,
        content: createCommentDto.content,
        depth: 0, // Root comment
        replyCount: 0,
        parentComment: null,
      });

      const savedComment = await manager.save(comment);

      // Update totalComments
      post.totalComments += 1;
      await manager.save(post);

      // Send notification to post owner if commenter is not the owner
      if (post.user.id !== userId) {
        await this.notificationsService.sendNotification(
          post.user.id,
          'New Comment',
          `${user.fullName} commented on your post`,
          NotificationType.POST,
        );
      }

      return savedComment;
    });
  }

  // GET COMMENTS (ROOT COMMENTS ONLY - depth 0)
  async getComments(postId: number, page: number = 1, limit: number = 20) {
    const post = await this.postsRepository.findOne({ where: { id: postId, isActive: true } });
    if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

    const [data, total] = await this.postCommentsRepository.findAndCount({
      where: { post: { id: postId }, depth: 0 }, // Only root comments
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
  }

  // ADD REPLY TO COMMENT (unlimited depth - Reddit/Facebook style)
  async addReply(postId: number, commentId: number, userId: number, content: string) {
    return await this.dataSource.transaction(async (manager) => {
      const parentComment = await manager.findOne(PostComment, {
        where: { id: commentId, post: { id: postId } },
        relations: ['post', 'post.user', 'user'],
      });

      if (!parentComment) throw new HttpException('Parent comment not found', HttpStatus.NOT_FOUND);

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      // Create reply - auto-calculate depth from parent
      const reply = manager.create(PostComment, {
        post: parentComment.post,
        user,
        content,
        parentComment,
        depth: parentComment.depth + 1, // Auto-increment depth
        replyCount: 0,
      });

      const savedReply = await manager.save(reply);

      // Update parent comment replyCount
      parentComment.replyCount += 1;
      await manager.save(parentComment);

      // Update post totalComments
      parentComment.post.totalComments += 1;
      await manager.save(parentComment.post);

      // Send notification to parent comment owner (not to self)
      if (parentComment.user.id !== userId) {
        await this.notificationsService.sendNotification(
          parentComment.user.id,
          'New Reply',
          `${user.fullName} replied to your comment`,
          NotificationType.POST,
        );
      }

      return savedReply;
    });
  }

  // GET REPLIES FOR A COMMENT
  async getReplies(postId: number, commentId: number, page: number = 1, limit: number = 20) {
    // Validate parent comment exists
    const parentComment = await this.postCommentsRepository.findOne({
      where: { id: commentId, post: { id: postId } },
    });

    if (!parentComment) throw new HttpException('Parent comment not found', HttpStatus.NOT_FOUND);

    const [data, total] = await this.postCommentsRepository.findAndCount({
      where: { parentComment: { id: commentId } },
      relations: ['user'],
      order: { createdAt: 'ASC' }, // Replies shown oldest first
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
  }

  // GET POSTS BY PRODUCT
  async getPostsByProduct(productId: number, page: number = 1, limit: number = 20) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    const [postProducts, total] = await this.postProductsRepository.findAndCount({
      where: { product: { id: productId }, post: { isActive: true } },
      relations: ['post', 'post.user', 'post.images', 'post.postProducts', 'post.postProducts.product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const posts = postProducts.map((pp) => pp.post);

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data: posts,
    };
  }

  // UPDATE COMMENT
  async updateComment(postId: number, commentId: number, userId: number, updateCommentDto: UpdateCommentDto) {
    return await this.dataSource.transaction(async (manager) => {
      const comment = await manager.findOne(PostComment, {
        where: { id: commentId, post: { id: postId } },
        relations: ['user', 'post'],
      });

      if (!comment) throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);

      // Check ownership
      if (comment.user.id !== userId) {
        throw new HttpException('You can only update your own comments', HttpStatus.FORBIDDEN);
      }

      comment.content = updateCommentDto.content;
      await manager.save(comment);

      return { message: 'Comment updated successfully', comment };
    });
  }

  // Helper: Recursively count total descendants (for unlimited depth deletion)
  private async countTotalDescendants(commentId: number, manager: EntityManager): Promise<number> {
    const directReplies = await manager.find(PostComment, {
      where: { parentComment: { id: commentId } },
      select: ['id', 'replyCount'],
    });

    if (directReplies.length === 0) return 0;

    let total = directReplies.length;

    // Recursively count nested replies
    for (const reply of directReplies) {
      total += await this.countTotalDescendants(reply.id, manager);
    }

    return total;
  }

  // DELETE COMMENT (handles cascade delete for unlimited depth)
  async deleteComment(postId: number, commentId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const comment = await manager.findOne(PostComment, {
        where: { id: commentId, post: { id: postId } },
        relations: ['user', 'post', 'parentComment'],
      });

      if (!comment) throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);

      // Check ownership
      if (comment.user.id !== userId) {
        throw new HttpException('You can only delete your own comments', HttpStatus.FORBIDDEN);
      }

      const post = comment.post;
      const parentComment = comment.parentComment;

      // Count total comments to be deleted (this comment + all nested descendants)
      const descendantsCount = await this.countTotalDescendants(comment.id, manager);
      const totalToDelete = 1 + descendantsCount;

      // If this is a reply, decrement parent's replyCount
      if (parentComment) {
        parentComment.replyCount = Math.max(0, parentComment.replyCount - 1);
        await manager.save(parentComment);
      }

      // Delete comment (cascade will delete all nested replies automatically)
      await manager.remove(comment);

      // Decrement post's totalComments by total deleted
      post.totalComments = Math.max(0, post.totalComments - totalToDelete);
      await manager.save(post);

      return {
        message: 'Comment deleted successfully',
        deletedCount: totalToDelete,
      };
    });
  }

  // TOGGLE BOOKMARK
  async toggleBookmark(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, { where: { id: postId, isActive: true } });
      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const existingBookmark = await manager.findOne(PostBookmark, {
        where: { post: { id: postId }, user: { id: userId } },
      });

      if (existingBookmark) {
        // Remove bookmark
        await manager.remove(existingBookmark);
        return { message: 'Bookmark removed', action: 'removed' };
      } else {
        // Add bookmark
        const user = await manager.findOne(User, { where: { id: userId } });
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const bookmark = manager.create(PostBookmark, { post, user });
        await manager.save(bookmark);

        return { message: 'Post bookmarked', action: 'bookmarked' };
      }
    });
  }

  // GET BOOKMARKED POSTS
  async getBookmarkedPosts(userId: number, page: number = 1, limit: number = 20) {
    const [bookmarks, total] = await this.postBookmarksRepository.findAndCount({
      where: { user: { id: userId }, post: { isActive: true } },
      relations: ['post', 'post.user', 'post.images', 'post.postProducts', 'post.postProducts.product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const posts = bookmarks.map((b) => b.post);

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data: posts,
    };
  }

  // SHARE POST
  async sharePost(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, { where: { id: postId, isActive: true } });
      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      // Create share record
      const share = manager.create(PostShare, { post, user });
      await manager.save(share);

      // Increment totalShares
      post.totalShares += 1;
      await manager.save(post);

      return {
        message: 'Post shared successfully',
        totalShares: post.totalShares,
      };
    });
  }

  // GET AUTHOR PROFILE WITH STATISTICS
  async getAuthorProfile(authorId: number) {
    const author = await this.dataSource
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.posts', 'posts', 'posts.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('posts.likes', 'likes')
      .where('user.id = :authorId', { authorId })
      .getOne();

    if (!author) throw new HttpException('Author not found', HttpStatus.NOT_FOUND);

    // Calculate total likes across all posts
    let totalLikes = 0;
    if (author.posts && author.posts.length > 0) {
      totalLikes = author.posts.reduce((sum, post) => sum + post.totalLikes, 0);
    }

    return {
      id: author.id,
      fullName: author.fullName,
      avatar: author.avatar,
      email: author.email,
      createdAt: author.createdAt,
      stats: {
        totalPosts: author.posts?.length || 0,
        totalLikes,
      },
    };
  }

  // GET AUTHOR'S POSTS WITH PAGINATION
  async getAuthorPosts(authorId: number, page: number = 1, limit: number = 20) {
    // Check if author exists
    const author = await this.dataSource.getRepository(User).findOne({ where: { id: authorId } });
    if (!author) throw new HttpException('Author not found', HttpStatus.NOT_FOUND);

    const [posts, total] = await this.postsRepository.findAndCount({
      where: { user: { id: authorId }, isActive: true },
      relations: ['user', 'images', 'postProducts', 'postProducts.product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      pagination: {
        total,
        page,
        limit,
      },
      data: posts,
    };
  }

  // ADMIN DELETE SINGLE POST (SOFT DELETE)
  async adminDelete(postId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId },
      });

      if (!post)
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      if (!post.isActive)
        throw new HttpException('Post is already deleted', HttpStatus.BAD_REQUEST);

      // Soft delete: set isActive to false
      post.isActive = false;
      await manager.save(post);

      return {
        message: 'Post deleted successfully',
        deletedId: postId,
      };
    });
  }

  // ADMIN DELETE MULTIPLE POSTS (SOFT DELETE)
  async adminDeleteMultiple(dto: DeletePostsDto) {
    const { ids } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const posts = await manager.find(Post, {
        where: { id: In(ids), isActive: true }
      });

      if (!posts || posts.length === 0)
        throw new HttpException(
          'No active posts found with the provided IDs',
          HttpStatus.NOT_FOUND
        );

      // Bulk update: set isActive to false
      await manager.update(Post, { id: In(posts.map(p => p.id)) }, { isActive: false });

      return {
        message: `${posts.length} post(s) deleted successfully`,
        deletedIds: posts.map(p => p.id),
      };
    });
  }

  // ADMIN RESTORE SINGLE POST
  async adminRestore(postId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, isActive: false },
        relations: ['user', 'images', 'postProducts'],
      });

      if (!post)
        throw new HttpException(
          'Deleted post not found',
          HttpStatus.NOT_FOUND
        );

      // Restore: set isActive to true
      post.isActive = true;
      await manager.save(post);

      return {
        message: 'Post restored successfully',
        restoredId: postId,
        post,
      };
    });
  }

  // ADMIN RESTORE MULTIPLE POSTS
  async adminRestoreMultiple(dto: RestorePostsDto) {
    const { ids } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const posts = await manager.find(Post, {
        where: { id: In(ids), isActive: false }
      });

      if (!posts || posts.length === 0)
        throw new HttpException(
          'No deleted posts found with the provided IDs',
          HttpStatus.NOT_FOUND
        );

      // Bulk update: set isActive to true
      await manager.update(Post, { id: In(posts.map(p => p.id)) }, { isActive: true });

      return {
        message: `${posts.length} post(s) restored successfully`,
        restoredIds: posts.map(p => p.id),
      };
    });
  }
}
