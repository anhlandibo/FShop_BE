import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like, In } from 'typeorm';
import { Post, PostImage, PostProduct, PostLike, PostComment } from './entities';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, QueryPostsDto } from './dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'src/constants';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postsRepository: Repository<Post>,
    @InjectRepository(PostImage) private postImagesRepository: Repository<PostImage>,
    @InjectRepository(PostProduct) private postProductsRepository: Repository<PostProduct>,
    @InjectRepository(PostLike) private postLikesRepository: Repository<PostLike>,
    @InjectRepository(PostComment) private postCommentsRepository: Repository<PostComment>,
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
        totalLikes: 0,
        totalComments: 0,
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
    if (sortType === 'popular') orderBy = { totalLikes: 'DESC', createdAt: 'DESC' };
    else orderBy = { createdAt: 'DESC' };
      
    // If custom sortBy provided, override
    if (sortBy && sortOrder) orderBy = { [sortBy]: sortOrder };
      
    const [data, total] = await this.postsRepository.findAndCount({
      where: search ? { content: Like(`%${search}%`) } : {},
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
      where: { id },
      relations: ['user', 'images', 'postProducts', 'postProducts.product', 'comments', 'comments.user'],
    });
    if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    return post;
  }

  // UPDATE POST
  async update(postId: number, userId: number, updatePostDto: UpdatePostDto) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId },
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

  // DELETE POST
  async delete(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId },
        relations: ['user', 'images'],
      });
      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      // Check ownership
      if (post.user.id !== userId) 
        throw new HttpException('You can only delete your own posts', HttpStatus.FORBIDDEN);
      
      // Delete images from Cloudinary
      if (post.images && post.images.length > 0) {
        for (const img of post.images) {
          if (img.publicId) {
            try {
              await this.cloudinaryService.deleteFile(img.publicId);
            } catch {
              /* Ignore errors */
            }
          }
        }
      }

      // Delete post (cascade will handle related entities)
      await manager.delete(Post, { id: postId });

      return { message: 'Post deleted successfully' };
    });
  }

  // TOGGLE LIKE (ADD/REMOVE)
  async toggleLike(postId: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId },
        relations: ['user'],
      });

      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const existingLike = await manager.findOne(PostLike, {
        where: { post: { id: postId }, user: { id: userId } },
      });

      if (existingLike) {
        // Unlike
        await manager.remove(existingLike);
        post.totalLikes = Math.max(0, post.totalLikes - 1);
        await manager.save(post);

        return {
          message: 'Post unliked',
          action: 'unliked',
          totalLikes: post.totalLikes,
        };
      } else {
        // Like
        const user = await manager.findOne(User, { where: { id: userId } });
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const like = manager.create(PostLike, { post, user });
        await manager.save(like);

        post.totalLikes += 1;
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
          totalLikes: post.totalLikes,
        };
      }
    });
  }

  // ADD COMMENT
  async addComment(postId: number, userId: number, createCommentDto: CreateCommentDto) {
    return await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId },
        relations: ['user'],
      });

      if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const comment = manager.create(PostComment, {
        post,
        user,
        content: createCommentDto.content,
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

  // GET COMMENTS
  async getComments(postId: number, page: number = 1, limit: number = 20) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

    const [data, total] = await this.postCommentsRepository.findAndCount({
      where: { post: { id: postId } },
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

  // GET POSTS BY PRODUCT
  async getPostsByProduct(productId: number, page: number = 1, limit: number = 20) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    const [postProducts, total] = await this.postProductsRepository.findAndCount({
      where: { product: { id: productId } },
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
}
